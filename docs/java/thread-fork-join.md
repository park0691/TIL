# Fork, Join, RecursiveTask
하나의 작업을 여러 개의 작은 작업으로 나누어 (`fork`) 계산하고, 작업한 결과를 병합하는 (`join`) 것을 말한다.

![fork-join](/images/java/20241003-fork-join-1.png)
_출처 : https://www.geeksforgeeks.org/forkjoinpool-class-in-java-with-examples/_

## ForkJoinPool
효율적인 병렬 처리를 위해서 Java 7에 도입되었다. 분할 정복 알고리즘을 통해 재귀적으로 처리하는 작업에 최적화된 Work Stealing 알고리즘을 사용하는 스레드 풀이다.

ForkJoinPool을 사용하면 큰 작업을 작은 단위로 분할한 후 이를 병렬로 처리할 수 있다.

상속 구조는 다음과 같다.
```
java.lang.Object
	java.util.concurrent.AbstractExecutorService
		java.util.concurrent.ForkJoinPool
```

### Work Stealing
![work-stealing](/images/java/20241003-fork-join-2.png)
_출처 : http://www.h-online.com/developer/features/The-fork-join-framework-in-Java-7-1762357.html_

작업을 분할하면 모든 CPU 코어에서 실행할 것이고 크기가 같은 각각의 작업은 같은 시간 안에 종료될 것이라 생각할 수 있다.

하지만 서브 작업의 완료시간은 크게 달라질 수 있다. 분할 기법이 효율적이지 않기 때문일 수 있고, 예기치 않게 디스크 접근 속도가 저하되거나 외부 서비스와 협력하는 과정에서 지연이 생길 수 있기 때문이다.

Fork/Join 프레임워크에서는 Work Stealing, 작업 훔치기 기법으로 이 문제를 해결한다. 작업 훔치기 기법에서는 ForkJoinPool의 모든 스레드를 거의 공정하게 분할한다. 각각의 스레드는 자신에게 할당된 작업을 포함한 이중 연결 리스트를 참조하면서 작업이 끝날 때마다 큐의 헤드에서 다른 작업을 가져와서 작업을 처리한다. 이때 한 스레드는 다른 스레드보다 자신에게 할당된 작업을 더 빨리 처리할 수 있다.

즉, 할 일이 없어진 스레드가 다른 스레드의 큐에서 대기하고 있는 작업을 가져가서 대신 해주는 것이다. 따라서 작업 스레드 간의 작업 부하를 비슷한 수준으로 유지할 수 있다.


## RecursiveAction, RecursiveTask
ForkJoinPool을 이용하려면 ForkJoinTask를 확장한 클래스를 사용해야 한다. ForkJoinTask를 확장한 추상 클래스는 RecursiveAction, RecursiveTask\<T> 이 있으며 이 클래스의 서브 클래스를 만들어서 사용한다.

RecursiveAction과 RecursiveTask\<T>의 차이는 처리 결과 값 리턴 여부이다. RecursiveTask\<T>은 결과 값을 리턴하며 RecursiveAction은 결과 값을 리턴하지 않는다.

두 클래스의 확장 관계는 다음과 같다.
```
java.lang.Object
    java.util.concurrent.ForkJoinTask<Void>
        java.util.concurrent.RecursiveAction
            implemented Serializable, Future<Void>
    
java.lang.Object
    java.util.concurrent.ForkJoinTask<V>
        java.util.concurrent.RecursiveTask<V>
            implemented Serializable, Future<Void>
```

두 클래스는 `compute()` 추상 메서드를 가지며 서브 클래스를 만들 때 `compute()` 메소드를 구현해야 한다.

`compute()` 메서드는 작업을 서브 작업으로 분할하는 로직과 더 이상 분할할 수 없을 때 개별 서브 작업의 처리 결과를 생산할 알고리즘을 정의한다. 대부분의 작업 수행은 다음과 같다.

```java
if (작업 단위가 충분히 작거나 더 이상 분할할 수 없으면) {
    해당 작업을 수행
} else {
    작업을 쪼개어 두 개의 작업으로 분할(재귀적 호출, fork)
    모든 서브태스크의 연산이 완료될 때까지 기다림
    각 서브태스크의 결과를 합칩(join)
}
```


### 예제 코드
```java
public class GetSum extends RecursiveTask<Long> {

    long from, to;

    public GetSum(long from, long to) {
        this.from = from;
        this.to = to;
    }

    @Override
    protected Long compute() {
        long gap = to - from;
        // 작업 단위가 충분히 작을 경우 -> 해당 작업 수행
        if (gap <= 3) {
            long tempSum = 0;
            for (long loop = from; loop <= to; loop++) {
                tempSum += loop;
            }
            return tempSum;
        }
        // 작업을 나누기 위해서 중간값 찾기
        long middle = (from + to) / 2;
        // 중간값을 이용하여 작업 수행을 위한 두 개의 객체 생성
        GetSum sumPre = new GetSum(from, middle);
        // 작업 하나를 수행하고
        sumPre.fork();
        // 두 번째 객체 생성
        GetSum sumPost = new GetSum(middle + 1, to);
        // 또 다른 작업을 수행한 후(sumPost.compute()) -> sumPre에서 시작한 작업을 기다린다.
        return sumPost.compute() + sumPre.join();
    }
}
```

`fork()` 메서드는 해당 작업을 스레드 풀의 작업 큐에 넣는 비동기 메서드이다.

```java
public class ForkJoinSample {
    static final ForkJoinPool mainPool = new ForkJoinPool();

    public static void main(String[] args) {
        ForkJoinSample sample = new ForkJoinSample();
        sample.calculate();
    }

    public void calculate() {
        long from = 0;
        long to = 10;

        GetSum sum = new GetSum(from, to);
        Long result = mainPool.invoke(sum);
        System.out.println("Fork Join: Total sum of " + from + " ~ " + to + " = " + result);
    }
}
```

## References
- Java의 신
- 모던 자바 인 액션