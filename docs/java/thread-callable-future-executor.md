# Callable, Future, Executor
## Thread와 Runnable의 한계
- 저수준의 API에 의존
- 값의 반환 불가능
- 매번 스레드 생성, 종료의 오버헤드
- 스레드 관리가 어려움

## Callable
기존 Runnable 인터페이스는 결과를 반환할 수 없었다. Runnable의 발전된 형태로써 Java 5부터 제네릭으로 결과를 받을 수 있는 Callable이 추가되었다.

반환 값과 Exception을 허용할 수 있는 것이 특징이다.

```java
@FunctionalInterface
public interface Callable<V> {
    V call() throws Exception;
}
```

## Future
Java 5부터 비동기 작업을 위해 도입된 `Future` 인터페이스는 이름 그대로 **미래 시점에 완료될 작업 결과를 얻는 모델**에 활용된다. <u>미래 시점에 완료될 `Callable`의 반환 값을 비동기로 받기 위해 사용되는 것</u>이 `Future` 인터페이스다.

DB 조회나 네트워크 통신 등 작업 시간이 오래 걸리거나 당장 가용한 스레드가 없는 경우, 실행 결과를 즉시 받지 못할 수 있다. 이때 이러한 비동기 계산 작업을 `Callable`을 통해 `Future` 내부로 설정하면, Future는 **계산이 모두 끝났을 때 결과에 접근할 수 있는 참조를 제공**한다.

이 방식의 가장 큰 장점은 자원의 효율적인 활용이다. 호출자 스레드는 `Future`에 시간이 걸리는 작업을 맡겨두고 결과를 기다리는 동안 멈춰있지 않고, 다른 유용한 작업을 병렬로 수행할 수 있다. 또한, 복잡한 저수준의 스레드를 직접 제어하고 관리하는 것보다 코드가 훨씬 직관적이고 이해하기 쉽다.

이를 위해 `Future` 인터페이스는 비동기 작업의 흐름을 제어할 수 있는 다음과 같은 메서드들을 제공한다.

```java
public interface Future<V> {
    boolean cancel(boolean mayInterruptIfRunning);
    boolean isCancelled();
    boolean isDone();
    V get() throws InterruptedException, ExecutionException;
    V get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException;
}
```

::: warning Future의 한계와 진화
`Future`는 비동기 프로그래밍을 크게 개선했지만, 결과를 가져오는 `get()` 메서드를 호출하는 순간 결과가 반환될 때까지 해당 스레드가 블로킹(Blocking)된다는 한계가 있다. 또한 여러 `Future`의 결과를 조합하거나 예외 처리를 하기 까다롭다는 단점이 있는데, 이를 보완하기 위해 Java 8부터는 콜백 체이닝 등이 가능한 `CompletableFuture`가 등장하게 되었다.
:::

### 주요 메소드
1. `get() / get(long timeout, TimeUnit unit)`
    - 블로킹 방식으로 결과값을 받아온다. 결과가 반환되기 전까지 호출한 스레드는 `block`된다.
    - timeout 시간을 지정할 수 있는데, 그 시간동안 반환되지 않으면 `TimeoutException` 발생한다.
    - `InterruptedException, ExecutionException` 등 체크된 예외를 던지기 때문에 적절한 예외 처리를 해야 한다.

2. `cancel(boolean mayInterruptIfRunning)`<br/>
    - 작업을 중단한다.
    - `mayInterruptIfRunning` 변수는 작업이 실행 중일 때 그 작업을 중단시킬지 여부를 결정한다. `true`로 설정된 경우 실행 중인 작업이 있다면 그 작업을 중단시킨다.
    - 성공적으로 작업이 취소되면 `true`를 반환하며, 작업이 이미 완료됬거나, 취소됬거나, 취소할 수 없는 경우 `false`를 반환한다.

3. `isDone()`<br/>
    - 작업의 완료 여부 반환

4. `isCancelled()`<br/>
    - 작업의 취소 여부 반환


### 예제 코드
```java
import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

public class DataReader implements Callable<String> {

    @Override
    public String call() throws Exception {
        System.out.println("Reading data...");
        TimeUnit.SECONDS.sleep(5);
        return "Data reading finished";
    }
}
```

```java
import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

public class DataProcessor implements Callable<String> {

    @Override
    public String call() throws Exception {
        System.out.println("Processing data...");
        TimeUnit.SECONDS.sleep(5);
        return "Data is processed";
    }
}
```


#### Future Task 수행하기
**수행할 작업을 `Callable` 구현 객체로 감싼 다음 `ExecutorService`에 `submit`한다.**

```java
ExecutorService executorService = Executors.newFixedThreadPool(2);

Future<String> dataReadFuture = executorService.submit(new DataReader());
Future<String> dataProcessFuture = executorService.submit(new DataProcessor());

while (!dataReadFuture.isDone() && !dataProcessFuture.isDone()) {
    System.out.println("Reading and processing not yet finished.");
    TimeUnit.SECONDS.sleep(1);
}

System.out.println(dataReadFuture.get());
System.out.println(dataProcessFuture.get());

executorService.shutdown();
```

```console
Reading and processing not yet finished.
Reading data...
Processing data...
Reading and processing not yet finished.
Reading and processing not yet finished.
Reading and processing not yet finished.
Reading and processing not yet finished.
Data reading finished
Data is processed
```

5초만에 프로그램이 종료되는 것을 확인할 수 있다.

`isDone()` 메서드로 Task가 끝나지 않았다면 1초를 기다린다.

두 Task가 모두 끝나면 `get()` 메서드로 반환값을 얻어온다.


#### `isDone()`를 뺀다면
```java
ExecutorService executorService = Executors.newFixedThreadPool(2);

Future<String> dataReadFuture = executorService.submit(new DataReader());
Future<String> dataProcessFuture = executorService.submit(new DataProcessor());

TimeUnit.SECONDS.sleep(1);

System.out.println(dataReadFuture.get());
System.out.println(dataProcessFuture.get());

executorService.shutdown();
```

이 코드 또한 5초만에 프로그램이 종료된다.

다른 점은 5초 중 4초는 `blocking`된다는 것이다. `get()` 호출하는동안 이 프로그램은 블로킹되어 있다.

#### Timeout
```java
ExecutorService executorService = Executors.newFixedThreadPool(2);

Future<String> dataReadFuture = executorService.submit(new DataReader());
Future<String> dataProcessFuture = executorService.submit(new DataProcessor());

try {
    System.out.println(dataReadFuture.get(3, TimeUnit.SECONDS));
    System.out.println(dataProcessFuture.get(10, TimeUnit.SECONDS));
} catch (InterruptedException | TimeoutException | ExecutionException e) {
    e.printStackTrace();
}

executorService.shutdown();
```

```console
Reading data...
Processing data...
java.util.concurrent.TimeoutException
	at java.base/java.util.concurrent.FutureTask.get(FutureTask.java:204)
	at study.thread.FutureTest.main(FutureTest.java:14)
```

5초의 시간이 필요한 작업을 3초의 제한을 두어 `TimeoutException`이 발생한다.

#### Cancel
```java
ExecutorService executorService = Executors.newFixedThreadPool(10);
Future<String> dataReadFuture = executorService.submit(new DataReader());
String dataReadResult = null;
boolean cancelled = false;
if (dataReadFuture.isDone()) {
    try {
        dataReadResult = dataReadFuture.get();
    } catch (ExecutionException | InterruptedException e) {
        e.printStackTrace();
    }
} else {
    cancelled = dataReadFuture.cancel(true);
}

if (!cancelled) {
    System.out.println(dataReadResult);
} else {
    System.out.println("Task was cancelled.");
}

executorService.shutdown();
```

```console
Task was cancelled.
```

5초가 지나기 전에 `isDone()`으로 반환 여부를 확인하므로 해당 Task가 끝나지 않는다.

취소된 작업을 `get()`하면 `CancellationException` 발생한다.

### 한계점
- 수동 완료(명시적 값 설정) 불가<br/>
    비동기 동작에 수동으로 결과를 제공하거나 프로그램적으로 `Future`를 완료시킬 수 없다. 즉, 예외가 발생하거나 특정 상황에서 개발자가 직접 결과 값과 상태를 셋팅할 수 없다.

- 비동기 작업의 조합 및 병합(Chaining) 부족<br/>
    두 개 이상의 비동기 계산 결과를 하나로 합치거나 연결하는 메커니즘이 없다. 서로 독립적인 두 개의 비동기 결과를 결합하거나, 첫 번째 결과에 의존하여 두 번째 비동기 작업을 실행하는 등의 파이프라인 구성이 어렵다.

- 다중 비동기 작업 제어의 어려움<br/>
    여러 개의 비동기 작업을 동시에 다룰 때 필요한 고급 제어 기능이 부족하다. 예를 들어, `Future` 집합이 실행하는 '모든 태스크의 완료'를 기다리거나, 집합 중에서 '가장 빨리 완료되는 태스크의 결과만' 먼저 가져오는 등의 처리가 까다롭다.

- 완료 동작에 대한 콜백(반응형) 처리 불가<br/>
    `Future` 작업이 완료되었을 때 이에 반응하여 다음 동작을 자동으로 실행하도록(콜백) 설정할 수 없다. 결과를 확인하려면 `get()` 메서드를 호출하여 스레드가 블로킹(대기) 상태에 빠져야만 한다.


## Executor
![executor](/images/java/20241003-thread-callable-future-executor-1.png)
_출처 : https://geekrai.blogspot.com/2013/07/executor-framework-in-java.html_

스레드 풀 구현을 위해 등장한 인터페이스

Executor는 인터페이스 분리 원칙(ISP)에 맞게 등록된 **작업을 실행하는 책임만 갖는 인터페이스**다. 따라서 전달받은 작업을 실행하는 `execute()` 메소드만 가진다.

- Concurrent API(`java.util.concurrent` 패키지)의 최상위 인터페이스
- 등록된 작업(`Runnable`)을 실행하기 위한 인터페이스

```java
public interface Executor {
    void execute(Runnable command);
}
```

::: warning 핵심 목적: 작업 제출과 작업 실행의 분리
과거에는 비동기 작업을 위해 `new Thread(new RunnableTask()).start()`처럼 스레드의 생성과 실행 방식을 개발자가 하드코딩해야 했다.

`Executor`는 **무엇을 할 것인가(Task)**와 **어떻게 실행할 것인가(Execution)**를 분리한다. 개발자는 그저 `execute()`로 작업을 던지기만 하면 되고, 그것을 새로운 스레드에서 실행할지, 스레드 풀(`Thread Pool`)을 사용할지, 아니면 동기적으로 Main 스레드에서 실행할지는 전적으로 `Executor`의 구현체에 위임된다.
:::

## ExecutorService
**`Executor` 인터페이스를 상속받아 기능을 대폭 확장한 하위 인터페이스**

단순히 `execute()`로 작업을 실행하는 것만으로는 실제 복잡한 애플리케이션을 제어하기 어렵다. 작업의 결과를 추적하거나, 더 이상 필요 없는 스레드를 안전하게 종료하는 등의 제어 기능이 필요하기 때문이다.

다수의 작업(Task)들을 스레드를 활용해 비동기로 수행하는 것은 생각보다 간단하지 않다. 단순히 `execute()`로 작업을 실행하는 것만으로는 실제 복잡한 애플리케이션을 제어하기 어렵기 때문이다. **스레드의 생성과 제거 등의 라이프사이클 관리나, 발생할 수 있는 여러 low-level의 복잡한 고려사항을 개발자가 직접 신경 쓰지 않도록 편리하게 추상화한 것**이 바로 `ExecutorService`이다.

따라서 작업의 생명주기를 제어하는 기능을 제공하며, 스레드를 실행하는 `submit` 메서드도 제공한다.

::: warning 스레드 풀(Thread Pool)을 통한 자원 관리
스레드를 매번 새로 생성하는 것은 운영체제 자원을 많이 소모하는 무거운 작업이다. 이를 해결하기 위해 `ExecutorService` 구현체들은 대부분 **재사용 가능한 스레드 풀**(Thread Pool)방식을 사용한다.

대표적으로 `ThreadPoolExecutor`가 `ExecutorService`의 핵심 구현체이다. `ExecutorService`에 작업을 지정해 주면, **스레드 풀에 사용 가능한 스레드가 있는지 확인하여 작업을 할당**한다.

작업은 내부의 큐(`Blocking Queue`)에 의해 관리되기 때문에, 만약 스레드 풀의 스레드 개수보다 실행할 작업이 더 많아 당장 가용한 스레드가 없다면 미실행된 작업은 **큐에 저장되어 대기**하게 된다. 이후 처리를 마친 스레드는 소멸되지 않고 큐에서 대기 중인 다음 작업을 할당받아 실행함으로써 자원을 효율적으로 재사용한다.
:::

### 초기화

1. `Executors` 팩토리 클래스를 이용한 초기화 (간편한 방법)<br/>
    `java.util.concurrent.Executors` 유틸리티 클래스는 자주 사용되는 스레드 풀 설정을 미리 만들어둔 팩토리 메서드들을 제공한다. 빠르고 간편하게 `ExecutorService`를 생성할 수 있어 가장 널리 사용된다.

    `Executors`에 대한 자세한 내용은 [아래 섹션](#executors)을 참고하자.

    ```java
    // 1. 10개 고정 사이즈의 ThreadPool 생성
    ExecutorService executorService = Executors.newFixedThreadPool(10);

    // 2. 1개 고정 사이즈의 ThreadPool 생성
    ExecutorService executorService = Executors.newSingleThreadExecutor();

    // 3. 유동적으로 증가하고 줄어드는 ThreadPool 생성
    ExecutorService executorService = Executors.newCachedThreadPool();

    ```

2. 직접 `new` 키워드 이용 `ThreadPoolExecutor` 생성<br/>
    `Executors` 클래스는 사용하기 편리하지만, 내부적으로 큐의 사이즈를 무한대(`Integer.MAX_VALUE`)로 잡거나 스레드를 무한정 생성할 위험이 있어 실무 환경에서는 **메모리 고갈(OOM: OutOfMemoryError)을 유발**할 수 있다는 단점이 있다.

    따라서 서비스의 트래픽과 서버 사양에 맞게 큐의 크기나 스레드의 최대 개수를 세밀하게 조절해야 할 때는 `ThreadPoolExecutor` 구현체를 직접 new 키워드로 생성하는 것을 권장한다.

    ```java
    ExecutorService customExecutor = new ThreadPoolExecutor(
        2,                              // corePoolSize: 기본적으로 유지할 최소 스레드 개수
        5,                              // maximumPoolSize: 큐가 꽉 찼을 때 생성할 수 있는 최대 스레드 개수
        120L,                           // keepAliveTime: 초과 생성된 유휴 스레드의 생존 시간
        TimeUnit.SECONDS,               // 시간 단위 (초)
        new ArrayBlockingQueue<>(100)   // workQueue: 100개까지만 대기할 수 있는 크기가 제한된 큐
    );
    ```

    이렇게 직접 생성하면, 기본 스레드 2개가 모두 일하고 있을 때 작업이 들어오면 100개까지는 큐에 쌓이고, 큐마저 다 차면 스레드를 최대 5개까지 늘려서 처리하는 안전하고 세밀한 스레드 풀을 만들 수 있다.

### 작업 할당
1. 단일 작업 제출: `execute()` vs `submit()`
    - `execute(Runnable command)`
        - 특징: 작업의 처리 결과를 반환받지 않는다. 작업의 상태를 알 수 없다.
        - 예외 처리: 작업 처리 도중 예외가 발생하면 해당 스레드는 종료되고 스레드 풀에서 제거되며, 콘솔에 에러가 출력된다. 이후 스레드 풀은 새로운 스레드를 다시 생성한다.
        ```java
        ExecutorService executor = Executors.newFixedThreadPool(2);

        executor.execute(() -> {
            System.out.println("execute()로 Runnable 작업 실행");
        });
        ```
    - `submit(Callable<T> task) / submit(Runnable task)`
        - 특징: 작업의 처리 결과를 담은 `Future` 객체를 반환한다.
        - 예외 처리: 실행 중 예외가 발생하더라도 스레드가 종료되지 않고 다음 작업에 재사용된다. 발생한 예외는 반환된 `Future` 객체에 저장되며, 추후 `future.get()`을 호출할 때 `ExecutionException`으로 발생하므로 개발자가 안전하게 예외를 제어할 수 있다. (실무에서 `submit()`을 훨씬 더 권장하는 이유)
        ```java
        ExecutorService executor = Executors.newFixedThreadPool(2);

        // Callable 작업 제출 (결과 반환)
        Future<String> future = executor.submit(() -> {
            Thread.sleep(1000);
            return "submit() 작업 완료!";
        });

        // 메인 스레드는 다른 작업을 하다가 필요할 때 결과를 꺼내볼 수 있음
        // String result = future.get();
        ```

2. 다중 작업 일괄 제출: `invokeAll()` vs `invokeAny()`<br/>
여러 개의 비동기 작업(`Callable`)을 리스트에 담아 한꺼번에 스레드 풀에 던져야 할 때 사용한다. 두 메서드 모두 결과를 얻을 때까지 현재 스레드를 대기(블로킹)시킨다.

    - `invokeAll(Collection<? extends Callable<T>> tasks)`
        - 제출된 **모든 작업이 완료될 때까지 기다렸다가**, 각각의 결과를 담은 `Future` 리스트를 반환한다.
        - 여러 개의 외부 API를 동시에 호출하고, 모든 응답이 모였을 때 다음 로직을 처리해야 하는 경우 유용
        ```java
        List<Callable<String>> tasks = Arrays.asList(
                () -> "작업 1 결과",
                () -> "작업 2 결과",
                () -> "작업 3 결과"
        );

        // 모든 작업이 끝날 때까지 대기 후 List 반환
        List<Future<String>> futures = executor.invokeAll(tasks);
        ```

    - `invokeAny(Collection<? extends Callable<T>> tasks)`
        - 제출된 작업 중 **가장 먼저 성공적으로 완료된 단 하나의 결과만 반환**한다. 하나가 성공하면 나머지 실행 중인 작업들은 자동으로 취소(인터럽트)된다.
        - 동일한 데이터를 제공하는 여러 개의 미러 서버에 동시에 요청을 보내고, 가장 빨리 응답이 온 서버의 데이터만 사용할 때 매우 효율적

        ```java
        // 가장 빨리 끝난 작업의 String 결과 하나만 반환 (나머지는 취소됨)
        String fastestResult = executor.invokeAny(tasks);
        ```
### 종료
`ExecutorService`에 작업을 모두 할당하고 처리가 끝났다면, 더 이상 스레드 풀이 필요하지 않을 때 반드시 명시적으로 종료해 주어야 한다. 스레드 풀 내부의 스레드들은 기본적으로 일반(Non-Daemon) 스레드이기 때문에, 명시적으로 종료하지 않으면 계속해서 다음 작업을 기다리게 된다. 이에 따라 애플리케이션(JVM)이 끝나지 않고 계속 대기하는 메모리 누수 상태에 빠질 수 있다.

이를 위해 `ExecutorService`는 상황에 맞게 스레드 풀을 종료할 수 있는 세 가지 핵심 메서드를 제공한다.

1. 부드러운 종료: `shutdown()`
	- 호출되는 순간부터 **새로운 작업의 제출은 거절**하지만, 이미 **실행 중인 작업과 큐(Queue)에서 대기 중인 모든 작업이 끝날 때까지 기다렸다가 안전하게 종료**한다. (Graceful Shutdown)
	- 데이터 손실 없이 모든 예약된 작업을 끝마쳐야 하는 일반적인 상황에서 가장 권장되는 종료 방식

2. 강제 종료: `shutdownNow()`
	- 호출 즉시 새로운 작업을 거절할 뿐만 아니라, 현재 **실행 중인 작업들에게 인터럽트(Interrupt)를 걸어 강제로 중단**시키려 시도한다. 또한, 큐에서 대기하고 있어서 **아예 시작조차 하지 못한 작업들의 리스트(`List<Runnable>`)를 반환**한다.
	- 애플리케이션이 당장 종료되어야 하거나, 무한 루프에 빠진 스레드가 있어 즉각적인 중단이 필요할 때 사용한다.
    ```java
    List<Runnable> notExecutedTasks = executor.shutdownNow();
    ```

3. 종료 대기: `awaitTermination()`
	- `shutdown()` 메서드는 스레드 풀 종료를 '요청'할 뿐, 코드는 즉시 다음 줄로 넘어간다. 만약 스레드 풀이 **완전히 종료될 때까지 메인 스레드가 기다려야 한다면** `awaitTermination()`을 함께 사용해야 한다.
	- 지정한 시간 동안 스레드 풀의 모든 작업이 종료되기를 기다린다. 시간 내에 모두 종료되면 `true`, 시간이 초과되면 `false`를 반환한다.

::: warning 실무에서 권장하는 안전한 종료 패턴 (Best Practice)
오라클(Oracle) 공식 문서와 실무 환경에서는 위 세 가지 메서드를 조합하여 **일단 부드럽게 종료를 시도하고, 일정 시간 내에 안 끝나면 강제 종료하는 패턴**을 표준으로 사용한다.

```java
executor.shutdown(); // 1. 새로운 작업 거절 및 부드러운 종료 요청

try {
    // 2. 60초 동안 대기하면서 기존 작업들이 끝나기를 기다림
    if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
        // 3. 60초가 지나도 안 끝나면 강제 종료 시도
        executor.shutdownNow();
        
        // 4. 강제 종료 후에도 잠시 대기하며 완전히 스레드가 죽기를 기다림
        if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
            System.err.println("스레드 풀이 정상적으로 종료되지 않았습니다.");
        }
    }
} catch (InterruptedException ie) {
    // 현재 스레드가 인터럽트 당하면 즉시 강제 종료
    executor.shutdownNow();
    Thread.currentThread().interrupt(); // 인터럽트 상태 복구
}
```
:::

### 라이프사이클 관리 메소드

| 메소드                                                | 설명                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| void shutdown()                                       | - 새로운 작업들을 더 이상 받아들이지 않음 <br/>\- 호출 전에 제출된 작업들은 그대로 실행이 끝나고 종료됨(Graceful Shutdown) |
| List\<Runnable> shutdownNow()                         | - shutdown 기능에 더해 이미 제출된 작업들을 인터럽트시킴(Abrupt Shutdown)<br/>\- 실행을 위해 대기중인 작업 목록(List\<Runnable>)을 반환 |
| boolean isShutdown()                                  | - Executor의 shutdown 여부를 반환                            |
| boolean isTerminated()                                | - shutdown 실행 후 모든 작업의 종료 여부를 반환              |
| boolean awaitTermination(long timeout, TimeUnit unit) | - shutdown 실행 후, 지정한 시간 동안 모든 작업이 종료될 때 까지 대기함<br/>- 지정한 시간 내에 모든 작업이 종료되었는지 여부를 반환 |

### 비동기 작업 메소드
Runnable, Callable 작업을 위한 메소드를 제공한다.

| 메소드    | 설명                                                         |
| --------- | ------------------------------------------------------------ |
| submit    | - 실행할 작업들을 요청(Runnable, Callable 처리), 작업의 결과를 반환<br/>- 실행 즉시 Future 객체를 반환한다.<br />- 처리 중 예외 발생하면 스레드를 제거하지 않고 다음 작업에 재사용한다. |
| execute   | - 실행할 작업들을 요청(Runnable만 처리), 작업의 결과를 반환하지 않는다.<br />- 처리 중 예외 발생하면 스레드 풀에서 해당 예외를 제거하고 새로운 스레드를 생성한다. |
| invokeAll | - 모든 결과가 나올 때 까지 대기하는 블로킹 방식의 요청<br/>- 동시에 주어진 작업들을 모두 실행하고, 전부 끝나면 각각의 상태와 결과를 갖는 List\<Future>을 반환 |
| invokeAny | - 가장 빨리 실행된 결과가 나올 때 까지 대기하는 블로킹 방식의 요청<br/>- 동시에 주어진 작업들을 모두 실행하고, 가장 빨리 완료된 하나의 결과를 Future로 반환 |


## Executors
- `Executor`, `ExecutorService`를 쉽게 사용할 수 있도록 돕는 유틸리티 클래스
- 개발자가 복잡한 스레드 풀 설정을 직접 구성할 필요 없이, 목적에 맞는 스레드 풀을 생성하는 팩토리 메서드를 제공한다.


| 메소드                        | 설명                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| newSingleThreadExecutor       | - 오직 하나의 스레드로 처리하며 나머지 스레드 생성 요청은 현재 스레드가 종료될때까지 대기한다. <br />\- 현재 메인 클래스에서 오직 하나의 스레드로 작업을 수행할 때 안전하게 사용할 수 있으나, 여러개의 스레드를 생성할 수 없다. |
| newFixedThreadPool            | \- 고정된 스레드 수를 갖는 스레드 풀을 생성한다. 스레드 풀 크기 내에서 스레드가 생성되어 병렬 처리된다.<br />\- 스레드 풀의 크기를 넘으면 풀에 여유가 생길때까지 큐에 대기한다. |
| newCachedThreadPool           | - 사용 가능한 스레드가 없다면 스레드를 새로 생성해서 작업을 처리하고, 있다면 기존 스레드를 재사용한다.<br />- 멀티 스레드 기반으로 동작한다는 점에서 newFixedThreadPool과 동일하지만, 등록한 스레드를 모두 한 번에 실행시키며 동시 처리에 대한 개수 제한이 없다.<br />- 일정 시간 스레드가 사용되지 않으면 회수한다. |
| newWorkStealingPool           | - Work Steal 알고리즘을 사용하는 ForkJoinPool을 생성한다.<br />\- 스레드 풀을 생성하며, 실행되는 하드웨어의 사용 가능한 모든 프로세스(CPU)의 코어를 쓰도록 병럴 처리 레벨을 설정한다.<br/>\- 해당 하드웨어의 자원을 모두 선점하려고 하기 때문에 다른 프로세스 혹은 애플리케이션 성능에 영향을 끼친다. |
| unconfigurableExecutorService | - 메서드의 입력 파라미터로 반드시 ExecutorService 객체를 전달해야한다. 그리고 해당 객체를 표준 ExecutorService 객체로 위임해서 결과를 리턴한다.<br/>\- ExecutorService를 구현한 여러 클래스의 기능 중 ExecutorService의 메서드만 호출하고 나머지 기능을 사용하지 못하도록 제한할 필요가 있을때 사용한다. |



## References
- https://javabom.tistory.com/96
- https://hudi.blog/java-thread-pool/
- https://devfunny.tistory.com/807
- https://geekrai.blogspot.com/2013/07/executor-framework-in-java.html