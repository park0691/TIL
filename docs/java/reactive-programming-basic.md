# Reactive Programming
리액티브 프로그래밍에서는 다양한 시스템과 소스에서 들어오는 데이터 항목 스트림을 비동기적으로 처리하고 합쳐서 문제를 해결한다.

## 리액티브 매니패스토
2013~2014년에 개발되었으며, 리액티브 애플리케이션과 시스템 개발의 핵심 원칙을 공식적으로 정의한다.

- 반응성(responsive) : 시스템은 가능한한 적정시간 안에 반응한다. 반응성이 뒷받침 되어야 사용성을 높일 수 있다.
- 탄력성(elastic) : 다양한 작업 부하에도 시스템 반응성이 유지된다. 작업 부하가 발생하면 자동으로 관련 컴포넌트에 할당된 자원의 수를 늘린다.
- 메시지 주도(message driven) : 컴포넌트 간의 약산 결합, 고립, 위치, 투명성이 유지되도록 시스템은 비동기 메시지 전달에 의존한다.
- 회복성(resilient) : 장애 시에도 시스템의 반응성은 유지된다.


## 리액티브 스트림과 Flow API
리액티브 프로그래밍은 리액티브 스트림을 사용하는 프로그래밍이다.

리액티브 스트림은 잠재적으로 무한의 비동기 데이터를 순서대로 처리하고, 블록하지 않는 역압력을 전제해 처리하는 표준 기술이다.

역압력 : pub-sub 프로토콜에서 publisher가 발행하는 속도 > subscriber가 소비하는 속도인 경우에 문제가 발생하지 않도록 보장하는 장치 + 기존 데이터 처리에 얼마나 시간이 걸리는지 업스트림 발행자에게 알릴 수 있어야함


### Flow 클래스 소개
Java 9에서 리액티브 프로그래밍을 제공하는 클래스 `java.util.concurrent.Flow`를 추가했다.

Publisher가 항목을 발행하면 Subscriber가 한 개씩 또는 한 번에 여러 항목을 소비하는데 Subscription이 이 과정을 관리하도록 여러 정적 메서드를 제공한다.

```java
public final class Flow {
    static final int DEFAULT_BUFFER_SIZE = 256;

    private Flow() {
    }

    public static int defaultBufferSize() {
        return 256;
    }

    public interface Processor<T, R> extends Flow.Subscriber<T>, Flow.Publisher<R> {
    }

    public interface Subscription {
        void request(long var1);
        void cancel();
    }

    public interface Subscriber<T> {
        void onSubscribe(Flow.Subscription var1);
        void onNext(T var1);
        void onError(Throwable var1);
        void onComplete();
    }

    @FunctionalInterface
    public interface Publisher<T> {
        void subscribe(Flow.Subscriber<? super T> var1);
    }
}
```

- Publisher
	- 많은 이벤트 제공이 가능하지만 Subscriber의 요구사항에 따라 역압력 기법에 의해 이벤트 제공 속도가 제한
- Subscriber
	- Publisher가 발행한 이벤트의 리스너로 자신을 등록할 수 있음
	- 콜백 메서드 4개 정의
	- 정의된 순서대로 호출을 통해 발행되어야 함
		- onSubscribe 메서드가 항상 처음 호출되고
		- 이어서 onNext가 여러 번 호출될 수 있다.
		- 이벤트 스트림은 영원히 지속되거나 onComplete 콜백을 통해 더 이상의 데이터가 없고 종료됨을 알릴 수 있으며, Publisher에 장애 발생 시 onError 호출할 수 있다.
    - Publisher에게 자신을 등록할 때 Publisher는 처음으로 onSubscribe 메서드를 호출해 Subscription 객체를 전달한다.
- Subscription
	- Publisher, Subscriber 사이의 제어 흐름, 역압력 관리
	- request() 메서드로 Publisher에게 주어진 개수의 이벤트를 처리할 준비가 되었음을 알릴 수 있다.
	- cancel() 메서드로 Subscription을 취소하여 더 이상 Publisher에게 이벤트를 받지 않음을 알린다.

Java 9 Flow 명세에는 이들 인터페이스 구현이 어떻게 서로 협력해야 하는지 규칙이 정의되어 있다.

- Publisher는 Subscription의 request 메서드에 정의된 개수 이하의 요소만 Subscriber에 전달한다.
- Publisher는 동작이 성공적으로 끝나면 onComplete, 문제가 발생하면 onError를 호출해 Subscription을 종료한다.
- Subscriber는 요소를 받아 처리할 수 있음을 Publisher에게 알려야 한다. (역압력 행사)
- onComplete나 onError를 처리하는 상황에서 Subscriber는 Publisher나 Subscription의 어떤 메서드도 호출 할수도없고 Subscription이 취소되었다 가정한다.
- Subscriber는 Subscription.reqeust() 호출 없이도 언제나 종료 시그널을 받을 준비가 되어있어야한다.
- Subscriber는 Subscription.canel() 이 호출된 이후에도 한 개 이상의 onNext를 받을 준비가 되어있어야 한다.


### 간단한 리액티브 애플리케이션 만들기

- 원격 온도계 TempInfo (0 ~ 99 사이의 화씨 온도를 임의로 만들어 연속적으로 보고)
```java
import java.util.Random;

public class TempInfo {
    public static final Random random = new Random();

    private final String town;
    private final int temp;

    public TempInfo(String town, int temp) {
        this.town = town;
        this.temp = temp;
    }

    // static factory method
    public static TempInfo fetch(String town) {
        // 1/10 확률로 온도 가져오기 작업이 실패함
        if (random.nextInt(10) == 0) {
            throw new RuntimeException("Error!");
        }
        return new TempInfo(town, random.nextInt(100));
    }

    @Override
    public String toString() {
        return town + " : " + temp;
    }

    public int getTemp() {
        return temp;
    }

    public String getTown() {
        return town;
    }
}
```

- Subscriber에게 TempInfo 스트림을 전송하는 Subscription
```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Flow;

public class TempSubscription implements Flow.Subscription {

    private static final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Flow.Subscriber<? super TempInfo> subscriber;
    private final String town;

    public TempSubscription(Flow.Subscriber<? super TempInfo> subscriber, String town) {
        this.subscriber = subscriber;
        this.town = town;
    }

    @Override
    public void request(long n) {
        executor.submit(() -> {
            for (long i = 0L; i < n; i++) {
                try {
                    // 현재 온도를 Subscriber로 전달
                    subscriber.onNext(TempInfo.fetch(town));
                } catch (Exception e) {
                    subscriber.onError(e);
                    break;
                }
            }
        });
    }

    @Override
    public void cancel() {
        // 구독 취소되면 완료(onComplete) 신호를 Subscriber로 전달
        subscriber.onComplete();
    }
}
```

- 받은 온도를 출력하는 Subscriber
```java
import java.util.concurrent.Flow.Subscriber;
import java.util.concurrent.Flow.Subscription;

public class TempSubscriber implements Subscriber<TempInfo> {

    private Subscription subscription;

    @Override
    public void onSubscribe(Subscription subscription) {
        // 구독을 저장하고 첫 번째 요청을 전달
        this.subscription = subscription;
        subscription.request(1);
    }

    @Override
    public void onNext(TempInfo tempInfo) {
        // 수신한 온도를 출력하고 다음 정보를 요청
        System.out.println(tempInfo);
        subscription.request(1);
    }

    @Override
    public void onError(Throwable t) {
        System.err.println(t.getMessage());
    }

    @Override
    public void onComplete() {
        System.out.println("Done!");
    }
}
```

https://jyami.tistory.com/132