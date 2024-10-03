# Thread, Runnable
![thread-and-runnable](/images/java/20240928-thread-runnable-1.png)
_출처 : https://www.javatpoint.com/runnable-interface-in-java_

- `java.lang` 패키지 내에 있다.



## Runnable
- 스레드가 작업할 내용을 정의하는 `run()` 메소드만 정의된 간단한 인터페이스
- `Thread` 클래스를 상속받으면 다중 상속이 불가한 경우 `Runnable` 인터페이스를 구현한다.

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

| 메소드     | 설명                        |
| ---------- | --------------------------- |
| void run() | 스레드가 시작되면 수행된다. |

### 구현
- `run()` 메소드를 시작점으로 작성하며 `start()` 메소드로 스레드를 시작한다.

```java
public class Task implements Runnable {
    @Override
    public void run() {
        int sum = 0;
        for (int index = 0; index < 10; index++) {
            sum += index;
            System.out.println(sum);
        }
        System.out.println(Thread.currentThread() + "최종 합 : " + sum);
    }
}
```

```java
public static void main(String args[]){
    Runnable task = new Task();
    new Thread(task).start();
    new Thread(task).start();
}
```


## Thread
Runnable 인터페이스를 구현한 클래스

### 구현
- `run()` 메소드를 시작점으로 작성하며 `start()` 메소드로 스레드를 시작한다.

```java
public class CustomThread extends Thread {
    @Override
    public void run() {
        int sum = 0;
        for (int index = 0; index < 10; index++) {
            sum += index;
            System.out.println(sum);
        }
        System.out.println( Thread.currentThread() + "최종 합 : " + sum);
    }
}
```

```java
public static void main(String args[]){
    Thread subTread1 = new CustomThread();

    // 익명 객체 생성
    Thread subTread2 = new Thread() {
        public void run() {
            int sum = 0;
            for (int index = 0; index < 10; index++) {
                sum += index;
                System.out.println(sum);
            }
            System.out.println( Thread.currentThread() + "최종 합 : " + sum);
        }
    };

    subTread1.start();
    subTread2.start();
}
```

### 생성자
| 생성자                                                       | 설명                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Thread()                                                     | 새로운 스레드 생성                                           |
| Thread(Runnable target)                                      | 매개변수로 받은 target 객체의 run() 메소드를 수행하는 스레드를 생성한다. |
| Thread(Runnable target, String name)                         | 매개변수로 받은 target 객체의 run() 메소드를 수행하고, name 이름을 갖는 스레드를 생성한다. |
| Thread(String name)                                          | name이란 이름의 스레드를 생성한다.                           |
| Thread(ThreadGroup group, Runnable target)                   | 매개 변수로 받은 group의 스레드 그룹에 속하는 target 객체의 run() 메소드를 수행하는 스레드를 생성한다. |
| Thread(ThreadGroup group, Runnable target, String name)      | 매개 변수로 받은 group의 스레드 그룹에 속하는 target 객체의 run() 메소드를 수행하고, name 이름을 갖는 스레드를 생성한다. |
| Thread(ThreadGroup group, Runnable target, String name, long stackSize) | 매개 변수로 받은 group의 스레드 그룹에 속하는 target 객체의 run() 메소드를 수행하고, name 이름을 갖는 스레드를 생성한다. 단, 해당 스레드 스택의 크기는 stackSize 만큼 가능하다. |
| Thread(ThreadGroup group, String name)                       | 매개 변수로 받은 group의 스레드 그룹에 속하는 name 이름을 갖는 스레드를 생성한다. |

- 어떤 스레드를 생성할 때 스레드 그룹으로 묶으면 `ThreadGroup` 클래스에서 제공하는 여러 메소드를 통해 각종 정보를 얻을 수 있다.
- 스택 사이즈를 의미한 stackSize 값은 스레드에서 얼마나 많은 메소드를 호출하는지, 얼마나 많은 스레드가 동시에 처리되는지 등 JVM이 실행되는 OS 플랫폼에 따라 다르다. 경우에 따라서는 이 값이 무시될 수 있다.


### 주요 메소드
| 메소드                                    | 설명                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| static void sleep(long millis)            | 매개변수로 넘어온 시간(1/1,000초)만큼 대기한다.              |
| static void sleep(long millis, int nanos) | 매개변수로 넘어온 시간(1/1,000초) + 두 번째 매개변수로 넘어온 시간(1/1,000,000,000초)만큼 대기한다. |
| void run()                                |                                                              |
| long getId()                              | 스레드의 고유 ID를 리턴한다.                                 |
| String getName()                          | 스레드의 이름을 리턴한다.                                    |
| void setName(String name)                 | 스레드의 이름을 지정한다.                                    |
| int getPriority()                         | 스레드의 우선순위를 확인한다.                                |
| void setPriority(int newPriority)         | 스레드의 우선순위를 지정한다.                                |
| boolean isDaemon()                        | 스레드가 데몬인지 확인한다.                                  |
| void setDaemon(boolean on)                | 스레드를 데몬으로 설정한다.                                  |
| StackTraceElement[] getStackTrace()       | 스레드의 스택 정보를 확인한다.                               |
| Thread.State getState()                   | 스레드의 상태를 확인한다.                                    |
| ThreadGroup getThreadGroup()              | 스레드의 그룹을 확인한다.                                    |


### 우선 순위
- 스레드의 우선순위는 대기하는 상황에서 먼저 수행할 수 있는 순위를 말한다.
- 값에 따라 스레드가 얻는 실행시간이 달라진다. 이 값은 기본값으로 사용하는 것을 권장한다.
- 우선 순위의 범위는 1~10이며 숫자가 높을 수록 우선순위가 높다.
- 스레드를 생성한 스레드로부터 우선순위를 상속받는다.
- 스레드 API에는 우선순위와 관계된 3개의 상수를 제공한다.

| 상수          | 설명                                     |
| ------------- | ---------------------------------------- |
| MAX_PRIORITY  | 가장 높은 우선순위이며, 그 값은 10이다.  |
| NORM_PRIORITY | 일반 스레드의 우선순위이며, 그 값은 5다. |
| MIN_PRIORITY  | 가장 낮은 우선순위이며, 그 값은 1이다.   |

### start()와 run()
`run()` 메소드는 생성된 스레드를 실행시키는 것이 아니라 단순히 클래스에 선언된 메소드를 호출할 뿐이다. 반면에 `start()`는 새로운 스레드가 작업하는데 필요한 호출 스택을 생성한 후, `run()`을 호출해서 생성된 호출 스택에 `run()`이 첫 번째로 올라가게 한다.

### main() 스레드
```java
class ThreadEx1 extends Thread{
    public void run(){
        throwException();
    }
    public void throwException(){
        try {
            throw new Exception();
        } catch(Exception e) {
            e.printStackTrace();
        }
    }
}
```

- main 메서드가 스레드의 start() 메소드를 호출한 후 호출 스택
```java
class ThreadExTest {
    public static void main(String[] args) throws Exception{
        ThreadEx1 t1 = new ThreadEx1();
        t1.start();
    }
}
```

호출 스택의 첫 번째 메서드가 main 메서드가 아니라 run 메서드다. 한 스레드가 예외 발생해서 종료되어도 다른 스레드의 실행에는 영향을 미치지 않는다. main 스레드는 종료되었기 때문에 main 메서드의 호출 스택이 없다.

- main 메서드가 스레드의 run() 메소드를 호출한 후 호출 스택
```java
class ThreadExTest {
    public static void main(String[] args) throws Exception{
        ThreadEx1 t1 = new ThreadEx1();
        t1.run();
    }
}
```

호출 스택의 첫 번째 메서드가 main 메서드이다. 앞의 코드와 달리 스레드가 새로 생성되지 않았다.

> main 메서드가 끝났다 하더라도 다른 스레드가 아직 끝나지 않았다면 프로그램은 종료되지 않는다. 실행 중인 스레드가 하나도 없을 때 프로그램이 종료된다.


## 데몬 스레드
- 백그라운드에서 동작하며 주로 서비스 스레드의 보조 역할을 수행하거나 특정 작업을 주기적으로 처리하기 위한 목적으로 사용된다.
- 일반 스레드가 종료되면 데몬 스레드도 함께 종료되며, 명시적으로 종료시키지 않아도 된다.
	- 그 이유는 일반 스레드의 보조 역할을 수행하므로 일반 스레드가 모두 종료되고 나면 데몬 스레드의 존재의 의미가 없기 때문이다.
- 해당 스레드가 시작(`start()` 메소드 호출)하기 전에 데몬 스레드로 지정되어야만 한다. 스레드가 시작한 다음에는 데몬으로 지정할 수 없다.
- 예로는 가비지 컬렉터, 워드프로세서의 자동저장, 화면 자동 갱신 등이 있다.

### 필요성
모니터링 스레드를 별도로 띄워 모니터링하다가, 주요 스레드가 종료되면 관련된 모니터링 스레드가 종료되어야 프로세스가 종료될 수 있다. 모니터링 스레드를 데몬 스레드로 만들지 않으면 프로세스가 종료될 수 없다. 이렇게 부가적인 작업을 수행할 때 데몬 스레드를 만든다.

### 예제 코드
```java
public class DaemonThread implements Runnable {

    static boolean autoSave = false;

    public static void main(String[] args) {
        Thread thread = new Thread(new DaemonThread());
        thread.setDaemon(true);  // 없으면 종료되지 않는다.
        thread.start();

        for (int i = 1; i <= 10; i++) {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {}
            
            System.out.println(i);

            if (i == 5) autoSave = true;
        }
    }

    @Override
    public void run() {
        while(true) {
            try {
                Thread.sleep(3 * 1000);
            } catch(InterruptedException e) {}
            
            if (autoSave) {
                autoSave();
            }
        }
    }

    public void autoSave() {
        System.out.println("작업파일이 자동저장되었습니다.");
    }
}
```
3초마다 변수 autoSave 값을 확인해서 그 값이 true이면 autoSave()를 호출하는 일을 무한 반복하도록 스레드를 작성한다. 만일 이 스레드를 데몬 스레드로 설정하지 않았다면 이 프로그램은 강제종료하지 않는 한 영원히 종료되지 않는다.

setDaemon() 메서드는 반드시 start()를 호출하기 전에 실행되어야 한다. 그렇지 않으면 `IllegalThreadStateException`이 발생한다.


::: warning 두 가지 방법을 제공하는 이유
자바에서는 한 클래스만 확장할 수 있다. 만약 어떤 클래스가 다른 클래스를 extends로 확장해야 하는데 스레드로 구현해야 한다. 게다가 그 부모 클래스는 Thread를 확장하지 않았다. 이런 경우 다중 상속이 불가하므로 해당 클래스를 스레드로 만들 수 없다. 하지만 인터페이스는 여러 개의 인터페이스를 구현해도 전혀 문제가 발생하지 않는다. 따라서 Runnable 인터페이스를 구현해서 사용한다.

스레드 클래스가 다른 클래스를 확장할 필요가 있는 경우 Runnable 인터페이스를 구현하며, 그렇지 않은 경우에는 Thread 클래스를 사용하는 것이 편리하다.
:::


## ThreadGroup
- 서로 관련된 스레드를 그룹으로 다루기 위한 개념이다.
- 보안상의 이유로 도입된 개념으로 자신이 속한 스레드 그룹이나 하위 스레드 그룹은 변경할 수 있지만 다른 스레드 그룹의 스레드를 변경할 수 없다.
- 모든 스레드는 반드시 스레드 그룹에 포함되기 때문에 스레드 그룹을 지정하는 생성자를 사용하지 않은 스레드는 기본적으로 자신을 생성한 스레드와 같은 스레드 그룹에 속하게 된다.

::: tip
Java 어플리케이션이 실행되면 JVM은 main, system 스레드 그룹을 만들고 JVM 운영에 필요한 스레드들을 생성해서 이 스레드 그룹에 포함시킨다. 예를 들어 main 메서드를 수행하는 main 이름의 스레드를 main 스레드 그룹에 속하고, GC를 수행하는 Finalizer 스레드는 system 스레드 그룹에 속한다.

우리가 생성하는 모든 스레드 그룹은 main 스레드 그룹의 하위 스레드 그룹이 되며, 스레드 그룹을 지정하지 않고 생성한 스레드는 자동으로 main 스레드 그룹에 속하게 된다.
:::



## 실행 제어

### 제어 메소드

| 메소드                            | 설명                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| Thread.State getState()           | 스레드의 상태 확인한다.                                      |
| void join()                       | 수행 중인 스레드가 중지할 때까지 대기한다.                   |
| void join(long millis)            | 매개 변수에 지정된 시간만큼(1/1,000초) 대기한다.             |
| void join(long millis, int nanos) | 첫 번째 매개 변수에 지정된 시간만큼(1/1,000초) + 두 번째 매개 변수에 지정된 시간(1/1,000,000,000초)만큼 대기한다. |
| void interrupt()                  | 수행 중인 스레드에 중지 요청한다.                            |
| void stop()                       | 스레드를 즉시 종료시킨다.                                    |
| void suspend()                    | 스레드를 일시정지시킨다. resume()을 호출하면 다시 실행대기상태가 된다. |
| void resume()                     | suspend()에 의해 일시정지상태에 있는 스레드를 실행대기상태로 만든다. |
| static void yield()               | 실행 중에 자신에게 주어진 실행시간을 다른 스레드에게 양보하고 자신은 실행대기상태가 된다. |


### 상태
![thread-status](/images/java/20240928-thread-runnable-2.png)

- NEW
	- 스레드가 생성되었지만, 아직 실행할 준비가 되지 않은 상태 (`start()` 호출되지 않은 상태)
- RUNNABLE
	- 스레드가 현재 실행되고 있거나, 실행 준비되어 스케줄링을 기다리는 상태
- BLOCK
	- 스레드가 I/O 작업을 요청하면 JVM이 자동으로 BLOCK 상태로 만든다.
    - 실행 중지 상태, 락이 풀리기만 기다리는 상태
- WAITING
	- 스레드가 어떤 객체 a에 대해 `a.wait()`을 호출하여, 다른 스레드가 `notify(), notifyAll()`을 호출할 때까지 무한정 기다리는 상태. 보통 스레드 동기화를 위해 사용한다.
- TIMED_WAITING
	- 특정 시간만큼 스레드가 대기 중인 상태
- TERMINATED
	- 스레드가 종료된 상태


## Synchronized

- 임계 영역을 설정하는데 사용된다.
- 여러 스레드에서 하나의 객체의 인스턴스 변수를 동시에 처리할 때 발생할 수 있는 동기화 문제를 해결하기 위해 사용한다. 즉, 인스턴스 변수가 선언되어 있다 하더라도 변수가 선언되어 있는 객체를 다른 스레드에서 공유할 일이 없다면 `synchronized`를 사용할 필요가 없다.

### 사용 방법

1. 메서드 자체를 `synchronized`로 선언
```java
// 1. 메서드 전체를 임계 영역으로 지정
public synchronized void calcSum() {
	// ...
}
```

- 메서드 전체가 임계 영역으로 설정된다. 스레드는 `synchronized` 메서드가 호출된 시점부터 해당 메소드가 포함된 객체의 Lock을 얻어 작업을 수행하다가 메서드가 종료되면 Lock을 반환한다.

2. 메소드 내의 특정 영역만 `synchronized`로 지정

```java
// 2. 특정 영역을 임계 영역으로 지정
Object lock = new Object();
synchronized(lock) {
	// ...
}
```

- 참조 변수는 락을 걸고자 하는 객체를 참조해야 한다. 이 블럭을 `synchronized 블럭`이라고 부르며, 이 영역 안으로 들어가면서 스레드는 지정된 객체의 Lock을 획득하고, 이 영억을 벗어나면 Lock을 반납한다.

두 방법 모두 Lock의 획득, 반납이 모두 자동으로 이루어지므로 임계 영역만 지정해주면 된다.

모든 객체는 Lock을 하나씩 가지고 있으며, 해당 객체의 Lock을 가진 스레드만 임계 영역의 코드를 수행할 수 있다. 그리고 다른 스레드들은 Lock을 얻을 때까지 기다린다.

임계 영역은 멀티 스레드 프로그램의 성능을 좌우하기 때문에 가급적 메서드 전체에 락을 걸기 보다 synchronized 블럭으로 임계 영역을 최소화해서 보다 효율적인 프로그램이 되는 것이 좋다.