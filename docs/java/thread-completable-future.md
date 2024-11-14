# CompletableFuture

## Future의 한계
- 외부에서 완료시킬 수 없다.
- 결과를 얻으려면 블로킹 방식으로 대기해야 한다.
- 여러 Future를 조합하고자 할 때 코드가 매우 복잡해진다.


## CompletableFuture
`Future`의 이러한 한계를 극복하기 위해 Java 8에서 `CompletableFuture`가 도입되었다. `CompletableFuture` 클래스는 Java 5에 추가된 `Future` 인터페이스와 `CompletionStage` 인터페이스를 구현하고 있다.

```java
public class CompletableFuture<T> implements Future<T>, CompletionStage<T> {}
```

::: tip CompletionStage
작업이 완료되면 결과를 처리하거나 여러 연산을 결합하여 다른 CompletionStage의 작업을 수행하는 인터페이스. 하나의 비동기 작업이 완료되었을 때 또다른 작업을 수행할 수 있게 메서드를 제공한다.
:::

기존 `Future`를 기반으로 외부에서 완료시킬 수 있어서 `CompletableFuture`란 이름을 갖게 되었다. 여러 연산을 결합한 비동기 처리, 예외 처리 등을 위한 50여 가지의 다양한 메소드를 제공한다.

[장점]
- 스레드의 선언 없이도 비동기 연산 작업을 구현할 수 있고 병렬 프로그래밍이 가능하다.
- 람다 표현식과 함수형 프로그래밍이 가능하여 코드의 양을 줄일 수 있다.
- 파이프라인 형태로 작업들을 연결할 수 있어서 비동기 작업의 순서를 정의, 관리할 수 있다.


### 비동기 작업 메소드
| 메소드      | 설명                                                         |
| ----------- | ------------------------------------------------------------ |
| runAsync    | - 반환값이 없는 경우<br />- CompletableFuture\<Void>를 반환   |
| supplyAsync | - 반환값이 있는 경우<br />- 작업의 결과를 포함하는 CompletableFuture를 반환 |


#### 예제 코드

- runAsync는 반환값이 없으므로 Void 타입으로 받는다.
```java
CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
    System.out.println("Thread: " + Thread.currentThread().getName());
});

future.get();
System.out.println("Thread: " + Thread.currentThread().getName());
```

```console
Thread: ForkJoinPool.commonPool-worker-51
Thread: main
```

- supplyAsync는 runAsync와 달리 반환값이 존재한다.
```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    return "Thread: " + Thread.currentThread().getName();
});

System.out.println(future.get());
System.out.println("Thread: " + Thread.currentThread().getName());
```

```console
Thread: ForkJoinPool.commonPool-worker-51
Thread: main
```
runAsync와 supplyAsync는 기본적으로 Java 7에 추가된 ForkJoinPool의 commonPool()을 사용해 작업을 실행할 쓰레드를 쓰레드 풀로부터 얻어 실행시킨다. 원하는 스레드 풀을 사용하려면 ExecutorService를 파라미터로 넘겨준다.


### 작업 콜백 메소드
| 메소드      | 설명                 |
| ----------- | -------------------- |
| thenApply[Async] | - 반환 값을 받아서 다른 값을 반환함<br/>- 함수형 인터페이스 Function을 파라미터로 받음<br />- 작업의 결과를 포함하는 CompletableFuture를 반환 |
| thenAccept[Async] | - 반환 값을 받아 처리하고 값을 반환하지 않음<br/>- 함수형 인터페이스 Consumer를 파라미터로 받음<br />- CompletableFuture\<Void>를 반환 |
| thenRun[Async] | - 반환 값을 받지 않고 다른 작업을 실행함<br/>- 함수형 인터페이스 Runnable을 파라미터로 받음<br />- CompletableFuture\<Void>를 반환 |

#### 예제 코드
- `thenApply`는 값을 받아서 다른 값을 반환한다.

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    return "Thread: " + Thread.currentThread().getName();
}).thenApply(s -> {
    return s.toUpperCase();
});

System.out.println(future.get());
```

- `thenAccept`는 반환값을 받아서 사용하고, 값을 반환하지 않는다.
```java
CompletableFuture<Void> future = CompletableFuture.supplyAsync(() -> {
    return "Thread: " + Thread.currentThread().getName();
}).thenAccept(s -> {
    System.out.println(s.toUpperCase());
});

future.get();
```
[Async]가 안 붙으면 이전 작업과 동일한 스레드에서 실행되며, <u>이전 작업과 동기</u>로 연산이 이루어진다.

- [Async]를 사용하면 이전 작업이 완료된 후 함수를 <u>새로운 스레드 또는 스래드 풀에서 비동기로 실행</u>한다. 이전 작업과 독립적으로 연산이 이루어지며, 작업의 병렬 처리를 가능하게 한다.
```java
CompletableFuture<Void> future = CompletableFuture
        .supplyAsync(() -> "Hello")
        .thenApplyAsync(s -> s + " World")
        .thenAcceptAsync(System.out::println);

System.out.println("Do Something...");

future.join();
```

위 코드에서는 `thenApplyAsync`가 이전 작업의 결과를 기다리는 동안 메인 스레드는 "Do Something..." 문장을 출력하는 등 다른 작업을 수행할 수 있다.

- Async 접미사가 붙은 메서드를 자세히 들여다보면 다른 스레드를 사용하기 위해 `Executor`를 직접 제공하거나, 기본 `Executor`를 사용할 수 있도록 선택권을 제공하는 것을 확인할 수 있다.


### 작업 조합 메소드

| 메소드      | 설명                                                         |
| ----------- | ------------------------------------------------------------ |
| thenCompose | - 두 작업이 이어서 실행되도록 조합하며, 이전 작업의 결과를 받아서 새로운 CompletableFuture를 생성하고 실행한다.<br />- 함수형 인터페이스 Function을 파라미터로 받음<br />- 작업의 결과를 포함하는 CompletableFuture를 반환 |
| thenCombine | - 두 작업을 독립적으로 실행하고, 둘 다 완료되었을 때 콜백을 실행함<br />- 함수형 인터페이스 BiFunction을 파라미터로 받음<br />- 작업의 결과를 포함하는 CompletableFuture를 반환 |
| allOf       | - 여러 작업들을 동시에 실행하고, 모든 작업 결과에 콜백을 실행함<br />- 모든 작업이 완료되면 CompletableFuture\<Void>를 반환 |
| anyOf       | - 여러 작업들 중에서 가장 빨리 끝난 하나의 결과에 콜백을 실행함<br />- 가장 먼저 완료된 작업의 결과를 포함하는 CompletableFuture\<Object>를 반환 |

#### 예제 코드
- 이전 작업의 결과인 "Hello" 문자열을 인자로 받아 새로운 CompletableFuture를 생성하고 실행한다.

```java
CompletableFuture<Void> future = CompletableFuture.supplyAsync(() -> "Hello")
        .thenComposeAsync(result -> CompletableFuture.supplyAsync(() -> result + " Test"))
        .thenAcceptAsync(System.out::println);

future.join();
```

thenComposeAsync를 사용하면 이전 작업의 결과를 기반으로 새로운 작업을 비동기로 실행한다. [Async] 유무의 차이점은 새로운 비동기 작업을 동기 또는 비동기로 실행하느냐에 있다.

- thenCombine은 각 작업을 독립적으로 실행하고 얻은 반환값을 조합해서 작업을 처리한다.

```java
CompletableFuture<String> first = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> second = CompletableFuture.supplyAsync(() -> "Test");
CompletableFuture<String> future = first.thenCombine(second, (a, b) -> a + " " + b);
System.out.println(future.get());
```

::: warning thenCompose[Async] vs thenCombine[Async]
thenCompose[Async]는 체인 형태의 비동기 작업을 처리하는 데 사용되며, thenCombine[Async]는 두 개의 독립적인 비동기 작업을 병렬로 처리하고 그 결과를 합치는 데 사용된다.
:::

- allOf는 모든 결과에 대해 콜백이 적용된다.

```java
public static void main(String[] args) throws ExecutionException, InterruptedException {
    CompletableFuture<String> first = CompletableFuture.supplyAsync(() -> "Hello");
    CompletableFuture<String> second = CompletableFuture.supplyAsync(() -> "Test");

    List<CompletableFuture<String>> futures = List.of(first, second);

    CompletableFuture<List<String>> result = CompletableFuture.allOf(futures.toArray(new CompletableFuture[futures.size()]))
            .thenApply(v -> futures.stream()
                    .map(CompletableFuture::join)
                    .collect(Collectors.toList())
            );

    result.get().forEach(System.out::println);
}
```

allOf 메서드는 여러 비동기 작업이 동시에 수행되어야 하고, 모든 작업이 완료될 때까지 기다려야 하는 상황에서 유용하게 사용할 수 있다. 주로 병렬 처리 작업에 사용된다.

- anyOf의 경우 가장 빨리 끝난 한 개 작업에 대해서만 콜백이 실행된다.
```java
public static void main(String[] args) throws ExecutionException, InterruptedException {
    CompletableFuture<String> first = CompletableFuture.supplyAsync(() -> {
        try {
            Thread.sleep(1000L);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        return "Hello";
    });
    CompletableFuture<String> second = CompletableFuture.supplyAsync(() -> "Test");

    CompletableFuture<Void> result = CompletableFuture.anyOf(first, second)
            .thenAccept(System.out::println);
}
```

anyOf 메서드는 여러 비동기 작업 중에서 가장 빠르게 완료되는 작업의 결과를 얻고자 할 때 유용하게 사용할 수 있다.

### 예외 처리 메소드

| 메소드      | 설명                                                         |
| ----------- | ------------------------------------------------------------ |
| exeptionally[Async] | - 발생한 에러를 받아서 예외를 처리, 대체값을 지정<br />- 함수형 인터페이스 Function을 파라미터로 받음 |
| handle[Async] | - (결과값, 에러)를 반환받아 에러가 발생한 경우와 아닌 경우 모두를 처리<br />- 함수형 인터페이스 BiFunction을 파라미터로 받음 |
| whenComplete[Async] | - (결과값, 에러)를 반환받아 새로운 값을 반환하지 않고 예외 처리만 수행<br />- 함수형 인터페이스 BiConsumer을 파라미터로 받음 |

#### 예제 코드
- `exceptionally[Async]` 메서드는 작업 중 예외가 발생했을 때 대체 값을 반환한다.
```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    if (true) {
        throw new IllegalArgumentException("Invalid Argument");
    }
    return "Thread: " + Thread.currentThread().getName();
}).exceptionally(e -> {
    System.out.println("Exception: " + e);
    return "default string";
});
```

- `handle[Async]` 메서드는 작업의 결과를 처리하거나, 작업 중 예외를 처리하는 역할을 한다. 작업이 정상적으로 완료되면 결과값을 반환하고 예외 발생 시 예외 처리를 한다.


```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    if (true) {
        throw new IllegalArgumentException("Invalid Argument");
    }
    return "Thread: " + Thread.currentThread().getName();
}).handle((result, e) -> {
    if (e != null) {
        System.out.println("Exception: " + e);
        return "default string";
    }
    return result;
});
```

- `whenComplete[Async]` 메서드는 작업의 결과나 예외를 받아 처리하되, 새로운 값을 반환하지 않는다. 원래의 CompletableFuture에 영향을 미치지 않고 예외 처리하는 역할만 수행한다.


```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    if (true) {
        throw new IllegalArgumentException("Invalid Argument");
    }
    return "Thread: " + Thread.currentThread().getName();
}).whenComplete((result, e) -> {
    if (e != null) {
        System.out.println("Exception: " + e);
    }
});
```

### 비동기 대기 메소드
- join()
  - 비동기 작업의 결과를 반환하며 작업이 완료될 때까지 현재 스레드를 대기 상태로 만든다.
  - 블로킹 메서드로 작용하여 해당 메서드를 호출한 스레드는 비동기 작업이 완료될 때까지 다른 작업을 수행하지 않고 대기한다.


::: warning get() 메서드와 join() 메서드의 차이
get() 메서드와 유사하지만 join() 메서드는 체크된 예외가 아닌 `CompletionException` 언체크된 예외를 발생시킨다.

`get()`과 중요한 차이점 중 하나는 `get()` 메서드는 인터럽트 가능하며, `join()` 메서드는 인터럽트가 블가능하다. 이는 호출하는 스레드가 인터럽트될 때 `get()` 메소드는 `InterruptedException`을 던지는 반면 `join()` 메소드는 CompletableFuture가 완료될 떄까지 차단된다.

또 다른 차이점은 `get()` 메소드는 `java.util.concurrent.Future` 인터페이스에 정의되어 있으므로 이 인터페이스를 구현하는 다른 클래스와 호환 가능하지만 `join()` 메소드는 CompletableFuture 클래스에만 국한되어 있으므로 CompletableFuture만 사용할 수 있다.
:::

- complete()
	- 현재 태스크를 종료하며 만일 태스크가 동작 중이라면 get 메서드와 동일하게 종료될때까지 대기하고, 최종 태스크 결과를 리턴한다.


## References
- https://mangkyu.tistory.com/263
- https://dkswnkk.tistory.com/733
- https://sh970901.tistory.com/139
- https://11st-tech.github.io/2024/01/04/completablefuture/