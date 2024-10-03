# Callable, Future, Executor
## Thread와 Runnable의 한계
- 저수준의 API에 의존
- 값의 반환 불가능
- 매번 스레드 생성, 종료의 오버헤드

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
미래에 반환될 결과를 나타내는 인터페이스. Java 5에서 비동기 작업을 위해 도입되었다.

가용 스레드가 없어서 실행이 미뤄지거나 작업 시간이 오래 걸리기 때문에 실행 결과를 바로 받지 못하고 미래에 얻게 될 수 있다. 미래 시점에 완료된 Callable의 반환 값을 구하기 위해 사용되는 것이 Future 인터페이스다.

Future는 비동기 작업을 갖고 있어 미래 실행 결과를 얻도록 도와준다. 이를 위해 비동기 작업의 현재 상태를 확인하고 기다리며, 결과를 얻는 방법 등을 제공한다.

저수준의 스레드에 비해 직관적으로 이해하기 쉬운 장점이 있다.

```java
public interface Future<V> {
    boolean cancel(boolean mayInterruptIfRunning);
    boolean isCancelled();
    boolean isDone();
    V get() throws InterruptedException, ExecutionException;
    V get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException;
}
```

### 주요 메소드
1. get() / get(long timeout, TimeUnit unit)
    - 블로킹 방식으로 결과값을 받아온다. 결과가 반환되기 전까지 호출한 스레드는 `block`된다.
    - timeout 시간을 지정할 수 있는데, 그 시간동안 반환되지 않으면 `TimeoutException` 발생한다.
    - `InterruptedException, ExecutionException` 등 체크된 예외를 던지기 때문에 적절한 예외 처리를 해야 한다.

2. cancel(boolean mayInterruptIfRunning)<br/>
    - 작업을 중단한다.
    - `mayInterruptIfRunning` 변수는 작업이 실행 중일 때 그 작업을 중단시킬지 여부를 결정한다. `true`로 설정된 경우 실행 중인 작업이 있다면 그 작업을 중단시킨다.
    - 성공적으로 작업이 취소되면 `true`를 반환하며, 작업이 이미 완료됬거나, 취소됬거나, 취소할 수 없는 경우 `false`를 반환한다.

3. isDone()<br/>
작업의 완료 여부 반환

4. isCancelled()<br/>
작업의 취소 여부 반환


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
수행할 작업을 `Callable` 구현 객체로 감싼 다음 `ExecutorService`에 `submit`한다.

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
- 명시적으로 셋팅할 수 없다. 즉, 그 값과 상태를 직접 셋팅할 수 없다.
- 병렬로 수행하고 병합하는 매커니즘이 없다.


## Executor
동시에 여러 요청을 처리해야 하는 경우 매번 새 스레드를 만드는 것은 비효율적이다. 스레드를 미리 만들어두고 재사용하기 위한 스레드 풀 개념이 등장하게 되었다. 이 인터페이스는 스레드 풀의 구현을 위한 인터페이스다.

- 등록된 작업(`Runnable`)을 실행하기 위한 인터페이스
- 작업 등록과 작업 실행 중에서 작업 실행만 책임진다.


Executor 인터페이스는 인터페이스 분리 원칙(ISP)에 맞게 등록된 작업을 실행하는 책임만 갖는다. 따라서 전달받은 작업을 실행하는 메소드만 가진다.

```java
public interface Executor {
    void execute(Runnable command);
}
```

## ExecutorService
작업의 등록을 책임지는 인터페이스
`Executor` 인터페이스를 상속받아서 작업 등록 뿐만 아니라 실행을 위한 책임도 가진다.

그래서 스레드 풀은 기본적으로 `ExecutorService` 인터페이스를 구현한다. 대표적으로 ThreadPoolExecutor가 ExecutorService의 구현체인데, ThreadPoolExecutor 내부의 Blocking Queue에 작업을 등록한다. 그리고 각 작업들을 스레드 풀의 사용 가능한 스레드에 할당하여 작업을 수행한다. 만약 사용 가능한 스레드가 없다면 작업은 큐에서 대기하게 되고, 스레드가 작업이 끝나면 큐에 있는 다음 작업을 할당받는다.

### 라이프사이클 관리 메소드

| 메소드                                                | 설명                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| void shutdown()                                       | - 새로운 작업들을 더 이상 받아들이지 않음 <br/>\- 호출 전에 제출된 작업들은 그대로 실행이 끝나고 종료된다.(Graceful Shutdown) |
| List\<Runnable> shutdownNow()                          | - shutdown 기능에 더해 이미 제출된 작업들을 인터럽트시킴<br/>\- 실행을 위해 대기중인 작업 목록(List\<Runnable>)을 반환 |
| boolean isShutdown()                                  | - Executor의 shutdown 여부를 반환                            |
| boolean isTerminated()                                | - shutdown 실행 후 모든 작업의 종료 여부를 반환              |
| boolean awaitTermination(long timeout, TimeUnit unit) | - shutdown 실행 후, 지정한 시간 동안 모든 작업이 종료될 때 까지 대기함<br/>- 지정한 시간 내에 모든 작업이 종료되었는지 여부를 반환 |

### 비동기 작업 메소드
Runnable, Callable 작업을 위한 메소드를 제공한다.

| 메소드    | 설명                                                         |
| --------- | ------------------------------------------------------------ |
| submit    | - 실행할 작업들을 요청(Runnable, Callable 처리), 작업의 결과를 반환<br/>- 실행 즉시 Future 객체를 반환한다. 반환된 객체의 `get()` 메서드로 스레드의 작업 결과를 가져올 수 있다.<br />- 처리 중 예외 발생하면 스레드를 제거하지 않고 다음 작업에 재사용한다. |
| execute   | - 실행할 작업들을 요청(Runnable만 처리), 작업의 결과를 반환하지 않는다.<br />- 처리 중 예외 발생하면 스레드 풀에서 해당 예외를 제거하고 새로운 스레드를 생성한다. |
| invokeAll | - 모든 결과가 나올 때 까지 대기하는 블로킹 방식의 요청<br/>- 동시에 주어진 작업들을 모두 실행하고, 전부 끝나면 각각의 상태와 결과를 갖는 List\<Future>을 반환 |
| invokeAny | - 가장 빨리 실행된 결과가 나올 때 까지 대기하는 블로킹 방식의 요청<br/>- 동시에 주어진 작업들을 모두 실행하고, 가장 빨리 완료된 하나의 결과를 Future로 반환 |

## Executors
`Executor`, `ExecutorService`를 쉽게 사용할 수 있도록 돕는 유틸리티 클래스
스레드 풀을 생성하는 팩토리 메서드를 제공한다.


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