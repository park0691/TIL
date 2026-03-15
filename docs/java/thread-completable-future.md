# CompletableFuture

## Future의 한계
- 결과를 얻으려면 무조건 대기해야 한다. (Blocking)
    - 비동기로 작업을 시작해 놓고도, 결국 그 결과가 필요해지는 시점에 `future.get()`을 호출하면 작업이 끝날 때까지 메인 스레드가 멈춰서 기다려야(Blocking) 한다. 진정한 의미의 `Non-blocking`을 구현하기 어렵다.
- 여러 비동기 작업의 연결(Chaining) 불가
    - "`A` 작업이 끝나면 그 결과를 받아서 `B` 작업을 비동기로 실행하고, `B`가 끝나면 `C`를 실행해라" 같은 연속적인 파이프라인을 구성할 수 없다. 이걸 구현하려면 지저분한 while 루프와 `isDone()`, `get()`을 떡칠해야 한다.
- 여러 Future를 조합하고자 할 때 코드가 매우 복잡해진다.
    - "회원 정보 조회(2초)와 결제 내역 조회(3초)가 모두 끝났을 때 화면을 렌더링해라" 혹은 "여러 API를 찔러서 가장 빨리 응답 온 것 하나만 채택해라" 같은 로직을 구현하기 매우 까다롭다.


## CompletableFuture
`Future`의 이러한 한계를 극복하기 위해 Java 8에서 `CompletableFuture`가 도입되었다. `CompletableFuture` 클래스는 Java 5에 추가된 `Future` 인터페이스와 `CompletionStage` 인터페이스를 구현하고 있다.

```java
public class CompletableFuture<T> implements Future<T>, CompletionStage<T> {}
```

::: tip CompletionStage
작업이 완료되면 결과를 처리하거나 여러 연산을 결합하여 다른 CompletionStage의 작업을 수행하는 인터페이스. 하나의 비동기 작업이 완료되었을 때 또다른 작업을 수행할 수 있게 메서드를 제공한다.
:::

기존 `Future`를 기반으로 외부에서 완료시킬 수 있어서 `CompletableFuture`란 이름을 갖게 되었다. 여러 연산을 결합한 비동기 처리, 예외 처리 등을 위한 50여 가지의 다양한 메소드를 제공한다.

**[개선]**

- 콜백(Callback) 기능 제공
    -  "작업이 끝나면 알아서 이 코드를 실행해 줘"라고 미리 예약해 둘 수 있다. 메인 스레드는 `get()`으로 기다릴 필요 없이 자기 할 일을 계속하면 된다.
    
    ```java
    // Future 방식: 결과가 나올 때까지 여기서 멈춤
    int result = future.get(); 
    System.out.println(result);
    
    // CompletableFuture 방식: 멈추지 않고 예약만 해둠 (Non-blocking)
    completableFuture.thenAccept(result -> System.out.println(result));
    ```
- 여러 비동기 작업들을 `Stream`처럼 체이닝할 수 있다.
    - `thenApply`, `thenCompose`, `thenAccept` 등의 메서드를 통해 작업의 흐름을 물 흐르듯 연결한다.
    
    ```java
    // 유저 정보를 가져와서 -> 권한을 확인하고 -> 이메일을 발송하는 비동기 체인
    CompletableFuture.supplyAsync(() -> getUser(id))
                     .thenApply(user -> checkPermission(user))
                     .thenAccept(permission -> sendEmail(permission));
    ```

- 여러 작업의 조합
    - `allOf()`(모두 완료될 때까지 대기)나 `anyOf()`(하나라도 완료되면 즉시 진행) 같은 강력한 조합 도구를 제공하여, 복잡한 병렬 처리 구조를 단 한 줄로 해결할 수 있게 해 준다.


**[장점]**
- 스레드의 선언 없이도 비동기 연산 작업을 구현할 수 있고 병렬 프로그래밍이 가능하다.
- 람다 표현식과 함수형 프로그래밍이 가능하여 코드의 양을 줄일 수 있다.
- 파이프라인 형태로 작업들을 연결할 수 있어서 비동기 작업의 순서를 정의, 관리할 수 있다.


### 비동기 작업 메소드
| 메소드      | 설명                                                         |
| ----------- | ------------------------------------------------------------ |
| runAsync    | - 반환값이 없는 경우 (`Runnable` 구현체 실행)<br />- CompletableFuture\<Void>를 반환   |
| supplyAsync | - 반환값이 있는 경우 (`Supplier` 구현체 실행)<br />- 작업의 결과를 포함하는 CompletableFuture를 반환 |


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
- `join()`
  - 비동기 작업의 결과를 반환하며 작업이 완료될 때까지 현재 스레드를 대기 상태로 만든다.
  - 블로킹 메서드로 작용하여 해당 메서드를 호출한 스레드는 비동기 작업이 완료될 때까지 다른 작업을 수행하지 않고 대기한다.


::: warning get() 메서드와 join() 메서드의 차이
get() 메서드와 유사하지만 join() 메서드는 체크된 예외가 아닌 `CompletionException` 언체크된 예외를 발생시킨다.

`get()`과 중요한 차이점 중 하나는 `get()` 메서드는 인터럽트 가능하며, `join()` 메서드는 인터럽트가 블가능하다. 이는 호출하는 스레드가 인터럽트될 때 `get()` 메소드는 `InterruptedException`을 던지는 반면 `join()` 메소드는 CompletableFuture가 완료될 떄까지 차단된다.

또 다른 차이점은 `get()` 메소드는 `java.util.concurrent.Future` 인터페이스에 정의되어 있으므로 이 인터페이스를 구현하는 다른 클래스와 호환 가능하지만 `join()` 메소드는 CompletableFuture 클래스에만 국한되어 있으므로 CompletableFuture만 사용할 수 있다.
:::

- `complete()`
	- 현재 태스크를 종료하며 만일 태스크가 동작 중이라면 get 메서드와 동일하게 종료될때까지 대기하고, 최종 태스크 결과를 리턴한다.

## 예제 코드
### 방식 1

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

public class Calculator {

    public int calculatePrice(Map condition) {
        int price = 10000;

        // 계산 로직 대신 10초 대기
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {}

        return price;
    }

    public static void main(String[] args) {
        List<Future<Integer>> futureList = new ArrayList<>();
        ExecutorService service = Executors.newFixedThreadPool(5);
        
        System.out.println("비동기 계산 시작...");
        
        for(int i = 0 ; i < 5 ; i++) {
            // 비동기 처리
            Future<Integer> future = service.submit(() -> {
                return new Calculator().calculatePrice(null);
            });

            futureList.add(future);
        }

        futureList.forEach(future -> {
            try {
                System.out.printf("계산 결과 : %s\n", future.get());
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        });
        
        System.out.println("모든 계산 완료!");
        
        service.shutdown();
    }
}
```

### 방식 2

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

public class Calculator {

    public int calculatePrice(Map condition) {
        int price = 10000;

        // 계산 로직 대신 10초 대기
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {}

        return price;
    }

    // 이 메서드 자체는 스레드가 끝날 때까지 기다리지 않고, CompletableFuture 객체를 즉시 반환한다.
    public Future<Integer> calculatePriceAsync(Map condition) {
        CompletableFuture<Integer> future = new CompletableFuture<>();

        new Thread(() -> {
            int price = calculatePrice(condition);
            // 계산이 끝나면 CompuletableFuture 상자에 결과값을 채워넣는다.
            future.complete(price);
        }).start();

        return future;
    }

    public static void main(String[] args) {
        Calculator cal = new Calculator();
        List<Future<Integer>> futureList = new ArrayList<>();

        System.out.println("비동기 계산 시작...");

        for (int i = 0; i < 5; i++) {
            Future<Integer> future = cal.calculatePriceAsync(null);
            futureList.add(future);
        }

        futureList.forEach(future -> {
            try {
                System.out.printf("계산 결과 : %s\n", future.get());
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        });
        
        System.out.println("모든 계산 완료!");
    }
}

```
**[calculatePriceAsync()]**<br/>

자바에서 `new Thread(() -> { ... })`를 실행할 때, 그 내부의 작업(Runnable)은 반환 타입이 `void` 다. 즉, 새로 만든 백그라운드 스레드가 5초 동안 열심히 `price`를 계산했더라도, 자신을 실행시킨 메인 스레드에게 그 값을 `return` 키워드로 직접 돌려줄 방법이 없다.

이 두 스레드 사이에서 **결과값을 안전하게 넘겨받을 수 있는 공용 매개체**가 필요한데, 그 역할을 하는 것이 바로 `CompletableFuture` 다.

이해하기 쉽게 카페의 ''**진동벨**'에 비유해 볼 수 있다.

1. **`new CompletableFuture<>()` (빈 상자 생성)**: 메인 스레드가 작업을 요청하면, 프로그램은 즉시 결과물 대신 '빈 상자(진동벨)'를 하나 만든다.

2. **`return future;` (상자 반환)**:
메인 스레드는 일단 이 빈 상자(진동벨)를 건네받고 돌아가서 다른 일을 하거나, `get()`을 호출해 상자에 무언가 들어오기를 기다린다.

3. **`new Thread(...)` (백그라운드 작업)**:
새로운 스레드(바리스타)는 뒤에서 5초 동안 열심히 보험료(커피)를 계산한다.

4. **`future.complete(price);` (상자에 값 채우기)**:
계산이 끝나면, 새로운 스레드는 메인 스레드가 들고 있는 그 빈 상자를 찾아가 진짜 결과값(price)을 쏙 집어넣고 뚜껑을 닫는다(complete). 이 `complete()`가 호출되는 순간, 빈 상자만 쳐다보며 기다리던(`future.get()`) 메인 스레드는 상자 안에 들어온 결과값을 꺼내서 다음 코드를 마저 실행한다.

결과적으로 `complete()`는 값을 직접 `return` 할 수 없는 스레드 환경에서, 비동기 작업의 최종 결과물을 약속된 바구니에 수동으로 꽂아 넣어주는 핵심적인 역할을 한다.

이런 수동적인 처리 과정이 번거롭고 실수가 나오기 쉽기 때문에, `방법 3` 코드에서는 `supplyAsync()`라는 메서드를 사용했다. `supplyAsync()`를 쓰면 우리가 직접 상자를 만들고 `complete()`로 값을 채우는 일련의 과정을 자바가 내부적으로 알아서 대신 처리해준다.

**[main()]**<br/>

- **작업 지시 (for 문)**: `calculatePriceAsync`를 5번 호출한다. 호출할 때마다 새로운 스레드가 생성되어 백그라운드에서 5초짜리 작업이 즉시 시작된다. 메인 스레드는 기다리지 않고 바로 다음 루프를 돌기 때문에, 거의 동시에 5개의 백그라운드 작업이 출발한다. 반환된 5개의 `Future` 객체는 `futureList`에 차곡차곡 담긴다.

- **결과 대기 (forEach 문)**: 리스트에 담긴 `Future` 객체들을 순회하며 `future.get()`을 호출한다.
    - `get()` 메서드는 해당 비동기 작업이 끝날 때까지(즉, `complete()`가 호출될 때까지) 메인 스레드를 대기(Block)시킨다.
    - 5개의 스레드가 동시에 5초를 카운트다운하고 있었으므로, 첫 번째 `get()`에서 약 5초를 기다리고 나면, 나머지 작업들도 이미 완료되었거나 곧 완료되기 때문에 연달아 결과가 출력된다.

- `calculatePriceAsync` 내부에서 `new Thread(...).start()`를 통해 매번 새로운 스레드를 직접 생성하는 것은 스레드 관리 측면에서 위험할 수 있다. 호출이 100번, 1000번 일어난다면 스레드도 무한정 생성되어 시스템의 메모리가 고갈(OutOfMemoryError)될 수 있기 때문이다.

이러한 수동 스레드 생성과 `future.complete()` 패턴을 완전히 대체할 수 있는 더 안전하고 간결한 Java 8의 `CompletableFuture.supplyAsync()` 문법이 있다.

### 방식 3

```java
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class Calculator {

    // 스레드 풀을 멤버 변수로 두어 스레드를 재사용하고 개수를 제한한다.
    // (스프링 부트 같은 환경에서는 이를 Bean으로 등록하여 전역적으로 관리한다.)
    private final ExecutorService executor = Executors.newFixedThreadPool(5);

    public int calculatePrice(Map<String, Object> condition) {
        int price = 10000;

        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            // 인터럽트 발생 시 스레드의 인터럽트 상태를 다시 설정해주는 것이 안전하다.
            Thread.currentThread().interrupt();
        }

        return price;
    }

    public CompletableFuture<Integer> calculatePriceAsync(Map<String, Object> condition) {
        // new Thread(...).start()와 future.complete()를 단 한 줄로 대체한다.
        // 지정된 스레드 풀(executor)에서 비동기로 작업을 수행하고 결과를 담아 반환한다.
        return CompletableFuture.supplyAsync(() -> calculatePrice(condition), executor);
    }

    // 자원 해제를 위한 메서드
    public void shutdown() {
        executor.shutdown();
    }

    public static void main(String[] args) {
        Calculator cal = new Calculator();

        System.out.println("비동기 계산 시작...");

        // 1. 작업 지시 (Java 8 스트림 API 활용)
        // 5번의 비동기 호출을 수행하고, 반환된 CompletableFuture들을 리스트로 수집한다.
        List<CompletableFuture<Integer>> futures = IntStream.range(0, 5)
                .mapToObj(i -> cal.calculatePriceAsync(null))
                .collect(Collectors.toList());

        // 2. 결과 대기 및 출력
        // get() 대신 join()을 사용하면 지저분한 try-catch 블록을 제거할 수 있다.
        futures.forEach(future -> {
            System.out.printf("계산 결과 : %s\n", future.join());
        });

        System.out.println("모든 계산 완료!");

        // 3. 애플리케이션 종료 전 스레드 풀 정리
        cal.shutdown();
    }
}
```
- **`CompletableFuture.supplyAsync()` 활용**: 직접 `new Thread()`를 호출하고 `future.complete()`로 값을 밀어 넣는 보일러플레이트 코드가 사라졌다. 메서드에 작업(Lambda)과 스레드 풀만 넘겨주면 알아서 비동기 파이프라인이 구성된다.

- **안전한 스레드 관리 (`ExecutorService`)**: 요청이 올 때마다 스레드를 무한정 생성하지 않고, 최대 5개의 스레드만 유지하는 `FixedThreadPool`을 재사용한다. 이는 시스템 메모리 고갈(`OutOfMemory`)을 방지하는 핵심적인 아키텍처 패턴이다.

- **`join()` 메서드 사용**: 기존의 `future.get()`은 `InterruptedException`과 `xecutionException`이라는 Checked Exception을 던지기 때문에 람다식 내부에서 `try-catch`로 감싸야 해서 코드가 지저분해졌다. 반면 `future.join()`은 Unchecked Exception을 발생시키므로 코드가 훨씬 깔끔해진다.

- **자원 해제 (`shutdown`)**: 작업이 끝난 후 스레드 풀을 안전하게 닫아주어 JVM이 정상적으로 프로세스를 종료할 수 있도록 처리했다.

## References
- https://mangkyu.tistory.com/263
- https://dkswnkk.tistory.com/733
- https://sh970901.tistory.com/139
- https://11st-tech.github.io/2024/01/04/completablefuture/