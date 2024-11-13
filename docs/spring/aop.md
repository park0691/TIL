# AOP
## AOP란
메소드나 객체의 기능을 핵심 관심사(Core Concern)와 부가 기능 (or) 공통/횡단 관심사(Cross-cutting Concern)으로 분리하고, <u>부가 기능을 모듈화</u>하여 재사용할 수 있도록 지원하는 프로그래밍 방식

![image](/images/spring/20241017-spring-aop-1.png)

여러 클래스에서 발생하는 중복 코드(횡단 관심사)를 별도의 모듈인 Aspect로 분리하고 Aspect를 적용할 메소드나 클래스에 Advice를 적용하여 코드의 재사용성, 유지 보수성을 높인다.

### 관심사의 분리
AOP의 매커니즘은 프로그램을 관심사 기준으로 `핵심 관심사`와 `횡단 관심사`로 나눈다.
- **핵심 관심사(Core Concern)**
	
	- 비즈니스 로직을 포함하는 기능. 객체가 가져야 할 본래의 기능

- **부가 기능, 공통 관심사, 횡단 관심사(Cross-Cutting Concern)**
	
	![image](/images/spring/20241017-spring-aop-2.png)
	
	- 비즈니스 로직은 아니지만 다수의 비즈니스 로직에 포함되는 중복된 코드들(또는 부가 기능)
    - 주로 인프라 로직 : 보안, 로깅, 트랜잭션, 성능 측정 등
    - 부가 기능적인 측면에서 보았을 때 코드의 횡단(가로) 영역의 공통된 부분을 추출했다 하여 횡단 관심사 ***Cross-Cutting Concern*** 로 부르기도 한다.


횡단 관심사는 비즈니스 로직과 별개이지만 대다수의 비즈니스 로직에 섞여 있어서 비즈니스 로직 코드를 읽기 어렵게 만들고, 코드의 중복으로 유지보수성을 떨어뜨려 테스트하기 어렵게 만들었다.

### OOP의 한계
AOP의 목표는 횡단 관심사를 분리하여 모듈화를 증가하는데 목표를 둔다.

OOP는 객체와 클래스의 초점을 맞춘 프로그래밍 기법이다. OOP의 가장 큰 장점은 상속과 추상화를 통해 기능을 분리하여 기능들을 유연하게 확장할 수 있다.

따라서 기존 클래스에서 추상화, 템플릿 메소드 패턴을 통해 횡단 관심사를 독립적인 모듈로 분리하여 관리할 수 있다.

예를 들어 트랜잭션(횡단 관심사)와 비즈니스 로직(핵심 관심사)가 공존하는 UserService 클래스가 있다고 하자. 우선적으로 기존 클래스에서 횡단 관심사와 핵심 관심사를 분리한다.

![image](/images/book/toby-ch-06-aop-2.png)

- UserService : 추상화된 비즈니스 모듈
- UserServiceImpl : 비즈니스 모듈 (핵심 관심사)
- UserServiceTx : 트랜잭션 모듈 (횡단 관심사)

분리된 핵심 관심사는 UserServiceImpl로 모듈화되어 관리하기 때문에 순수 비즈니스 로직에만 충실하게 되어 코드가 직관적이며 유지보수성이 좋아진다.

```java
public class UserServiceTx implements UserService {
    UserService userService;
    PlatformTransactionManager transactionManager;
	
	...
	
    public void upgradeLevels() {
        TransactionStatus status = this.transactionManager
                .getTransaction(new DefaultTransactionDefinition());
        try {
            // Business Logic (DI 받은 UserService 오브젝트에 모든 기능을 위임)
            userService.upgradeLevels();

            this.transactionManager.commit(status);
        } catch (RuntimeException e) {
            this.transactionManager.rollback(status);
            throw e;
        }
    }
}
```

UserServiceTx에서 비즈니스 로직에 트랜잭션 기능을 추가했다. 유연한 기능의 확장을 위해 UserService 인터페이스에 의존한다.

의존성 주입을 통해 UserService에 UserServiceTx를 주입하고, UserServiceTx에 UserServiceImpl을 주입하여 의존성을 만들어줌으로써 기존 클래스와 동일하게 비즈니스 로직 호출 시 트랜잭션이 호출된다.

하지만 다음과 같은 한계가 있다.

1. 다른 클래스의 메소드에 적용해야 한다면 → 적용할 다른 클래스의 추상화 클래스를 또 만들어야 한다.
2. 다른 횡단 관심사를 적용해야 한다면 → 추상화 클래스를 구현한 또다른 구체 클레스를 만들어야 하며, <u>의존 관계도 복잡</u>해 질 것이다.

공통된 횡단 관심사를 재사용하기 위해 추상화, 상속, 위임을 사용했지만 전체 애플리케이션 여기저기에서 부가 기능이 사용되거나 적용해야할 부가 기능이 많아진다면 문제가 발생한다.

![image](/images/spring/20241017-spring-aop-3.png)

횡단 관심사를 적용해야 할 클래스가 많아지면 매우 많은 추상화 클래스가 생기게 되고, 적용해야 할 횡단 관심사가 많아진다면 의존 관계도 복잡해진다. 추상화 클래스의 본질적인 장점과 다르게 오히려 이를 관리하는데 더 많은 비용이 들게 된다.

### AOP의 필요성
이러한 OOP의 한계점들을 보완하고자 등장한 기술이 AOP다.

- 횡단 관심사의 모듈화
- 효율적인 횡단 관심사 모듈 관리

![image](/images/spring/20241017-spring-aop-4.png)

분리된 횡단 관심사를 Aspect로 모듈화한다. 자체적으로 횡단 관심사를 여러 객체의 핵심 기능에 교차로 적용해 주기 때문에 추상화를 통해 분리하는 작업도 필요가 없어진다. 따라서 횡단 관심사 모듈을 효율적으로 관리할 수 있다.

### 장점

- 로깅, 트랜젝션, 보안, 캐싱 등과 같은 공통 관심사를 모듈화하여 <u>중복 코드의 제거, 코드의 유지보수성을 향상</u>시킨다.
  - 여러 곳에서 사용되는 중복 코드를 한 곳에서 유지하고 관리할 수 있는 이점
  - 코드 재사용성 극대화
- 핵심 로직과 부가 기능의 명확한 분리 → 개발자가 핵심 로직을 개발할 때 자신의 목적 외의 부가 기능은 신경 쓰지 않고 개발에 집중할 수 있다.

### Spring AOP

- 스프링 프레임워크에서 관점 지향 프로그래밍을 지원하는 기술
    - 스프링 빈에만 AOP 적용 가능
- **프록시 패턴 기반의 AOP 구현체**
    - Spring은 <u>Target 객체에 대한 **프록시를 만들어서 제공**</u>한다.
    - 프록시는 Advice를 타겟 객체에 적용하면서 생성되는 객체
- 런타임 위빙
    - 타겟을 감싸는 프록시는 런타임에 생성된다.
- **프록시가 호출을 가로챈다 (Intercept)**
    - 전처리 어드바이스 : 프록시는 타겟 객체에 대한 호출을 가로챈 다음 Advice의 부가 기능 로직을 수행한 후에 타겟의 핵심 기능 로직을 호출한다.
    - 후처리 어드바이스 : 타겟의 핵심 기능 로직 메소드를 호출한 후에 부가 기능을 수행하는 경우도 있다.
- **메소드 JoinPoint만 지원한다.**
    - Spring은 동적 프록시를 기반으로 AOP를 구현하므로 메소드 조인 포인트만 지원
    - **타겟의 메소드가 호출되는 런타임 시점에만 부가기능(어드바이스) 적용 가능**
    - 반면, AspectJ같은 고급 AOP 프레임워크를 사용하면 객체의 생성, 필드 값의 조회와 조작, static 메소드 호출 및 동기화 등의 다양한 작업에 부가 기능을 적용할 수 있다.


## 주요 개념
AOP의 핵심은 프로그램을 핵심 관심사, 횡단 관심사로 분리하고 분리된 관심사는 모듈성을 가져야 한다는 것이다.

AOP의 개발 방식은 핵심 관심사를 Object로 횡단 관심사는 Aspect로 모듈화하여 각각 다른 영역으로 개발한다.

![image](/images/spring/20241017-spring-aop-5.png)

### 용어
- **Target**
    - [**어떤 클래스에 부가 기능을 부여할 것인가?**]
    - 핵심 기능을 담고 있는 모듈로, 부가 기능을 부여할 대상
- **Join Point**
    - [**어디에 적용할 것인가?** *메서드, 필드, 객체, 생성자*]
		- 예외가 발생하거나 / 필드가 수정될 때 / 객체가 생성될 때 / 메서드가 호출될 때
    - (Target Object 안에서) Advice가 적용될 위치
    - 일반적으로 AspectJ는 모든 JoinPoint에 접근 가능하지만 Spring AOP는 기본적으로 Method Interceptor를 기반하고 있어서 JoinPoint는 항상 메소드 단위다.
- **Advice**
	![image](/images/spring/20241017-spring-aop-6.png)
    - [**어떤 부가 기능을 부여할 것인가?**]
    - 부가 기능을 담은 구현체, JoinPoint에서 적용할 (횡단 관심사) 코드
    - 타겟 오브젝트에 종속되지 않기 때문에 부가 기능에만 집중할 수 있음
- **Point Cut**
	![image](/images/spring/20241017-spring-aop-8.png)
    - [**실제 Advice가 적용될 지점**]
    - Advice는 여러 JoinPoint 중에서 포인트컷의 표현식에 명시된 조인 포인트에서 실행된다.
    - Spring AOP에서는 Advice가 적용될 메서드를 선정
- **Aspect**
	![image](/images/spring/20241017-spring-aop-9.png)
    - ***Point Cut + Advice를 모듈화한 것***
- **Weaving**
    - 핵심 로직 코드(*Target의 JoinPoint*)에 Advice를 적용하는 것
- **Proxy**
    - Aspect를 대신 수행하기 위해 AOP 프레임워크에 의해 생성된 객체
    - Target을 감싸서 Target의 요청을 대신 받아주는 랩핑 오브젝트
    - 클라이언트에서 Target을 호출하면 타겟이 아닌, 타겟을 감싸는 Proxy가 호출되어 타겟 메소드 실행 전에 선처리, 후처리를 실행한다.

### Advice 종류

![image](/images/spring/20241017-spring-aop-7.png)

Spring AOP는 JoinPoint와 횡단 코드의 결합점을 제어하도록 다양한 Advice를 제공한다.

- Before : 메서드 호출 전에 동작
- AfterReturning : **<u>예외 없이</u>** 호출된 메서드 실행 후 동작
  - `returning` 속성으로 리턴 값 받아올 수 있음
- AfterThrowing : 메서드 실행 중 <u>**예외가 발생**</u>했을 때 동작
  - `throwing` 속성 값으로 예외 받아올 수 있음
- After : (**<u>예외 발생 여부 관계없이</u>**) 호출된 메서드 실행 후 동작
- Around : 메서드 실행 전/후에 동작
  - 리턴 타입 `Object`, 첫번째 파라미터로 `ProceedingJoinPoint`
  - `joinPoint.proceed()` 반드시 실행
  - 타겟의 전/후, 심지어 예외 처리를 모두 정의할 수 있기 때문에 자유도가 높다.
- Around를 제외한 4가지 Advice는 리턴 타입이 `void`, 첫 번째 파라미터로 `JoinPoint`
- ***Around → Before → [Logic] → AfterReturning → After → Around***
- ***Around → Before → [Logic] → AfterThrowing → After***

### Advice 순서
- Advice는 순서를 보장하지 않는다.
- `@Aspect` 단위로 순서를 지정하고 싶다면 `@Order` 를 사용한다. (클래스 단위)
	- 한 Aspect 클래스에 여러 Advice의 순서를 지정할 수 없으므로 별도의 Aspect 클래스로 분리해야 한다.
- 클래스 레벨에 `@Aspect` 어노테이션을 선언하고, `@Around` 어노테이션이 붙은 메소드를 선언하면 하나의 Advisor가 완성된다.
- 스프링 AOP의 빈 후처리기 `AnnotationAwareAspectJAutoProxyCreator` 가 `@Aspect`로 적용된 클래스들을 찾아서 Advisor로 등록해준다. 즉, 스프링 AOP의 빈 후처리기는 스프링 빈으로 등록된 Advisor 뿐만 아니라 `@Aspect` 어노테이션도 찾아서 Advisor로 변환하고 프록시를 생성한다.

### Weaving 종류

- Compile Time Weaving, CTW
    - AspectJ에는 AJC(AspectJ Compiler) 컴파일러가 있는데, Java Compiler를 확장한 형태의 컴파일러이다.
    - ABC.java → ABC.class로 <u>컴파일할 때 바이트 코드 조작</u>을 통해 해당 Advisor 코드를 직접 끼워 넣는다.
    - 가장 빠른 퍼포먼스
    - 하지만 lombok과 같이 컴파일 과정에서 코드를 조작하는 플러그인과 충돌 발생할 가능성이 아주 높다.
- Runtime Weaving, RTW
    - Spring AOP에서 사용하는 방식으로 프록시 객체를 생성해 실제 타겟 객체에 영향을 주지 않고 위빙을 수행한다.
    - 실제 런타임에 메소드 호출 시 위빙이 이루어진다.
    - 소스 코드, 클래스 파일에 변형이 없는 장점이 있지만 포인트 컷에 대한 Advice 수가 늘어날 수록 성능이 떨어지는 단점
- Load Time Weaving, LTW
    - 런타임에 <u>클래스 로더가 클래스를 JVM에 로드할 때</u> 위빙한다.
    - AspectJ Weaver를 클래스 로더에 연결하여 클래스가 로드될 때 바이트 코드를 조작하여 Aspect를 주입한다.
    - 컴파일 시간은 상대적으로 Comple Time Weaving보다 짧지만, 오브젝트가 메모리에 올라가는 과정에서 위빙이 발생하기 때문에 <u>런타임 시간은 Compile Time Weaving보다 상대적으로 느리다</u>.
    - ApplicationContext에 객체가 로드될 때 객체 핸들링이 발생하므로 퍼포먼스 저하

::: details AOP는 무엇이고 왜 사용할까요?
AOP는 부가 기능을 핵심 기능에서 분리하고 모듈화하여 한 곳에서 관리하고, 이 부가 기능을 어디에 적용할지 선택하도록 하는 프로그래밍 방식입니다.

애플리케이션 로직은 크게 객체가 제공하는 고유의 기능인 핵심 기능과, 핵심 기능을 도와주는 부가 기능으로 나눈다. 부가 기능은 로깅, 트랜잭션 같은 것들, …

보통 기존 프로젝트에 부가 기능, 로깅을 추가한다면, 한 클래스가 아니라 여러 곳에 동일하게 사용한다. → 이렇게 되면 문제점이 발생하는데, 부가 기능을 적용해야 할 클래스가 100개라면 100개에 모두 똑같은 부가 기능 코드를 추가해야 하므로 매우 복잡하다. 추가할 때도 복잡하지만, 만약 수정이 필요하다면 100개의 클래스를 모두 뜯어 고쳐야 하므로 효율적이지 못한 문제가 있다.

AOP의 A에 해당하는 Aspect는 관점이라는 뜻으로, 말 그대로, 애플리케이션을 보는 관점을 횡단 관심사의 관점으로 달리 보는 방식을 말하며, 이러한 프로그래밍 방식을 관점 지향 프로그래밍이라고 합니다.

AOP를 통해 핵심 기능과 부가 기능을 명확히 분리하여, 코드의 재사용성과 유지 보수성을 높이고, 핵심 로직은 부가 기능에 신경쓰지 않고 본연의 기능에만 충실할 수 있는 장점이 있습니다.
:::

::: details AOP를 구현할 때 Advice, Pointcut 같은 용어를 사용합니다. 어떤 것들을 알고 계신가요?
먼저 처리될 지점과 무엇을 처리할 것인지 정의한 Advice와 어느 대상에게 Advice를 적용할지 표현하는 PointCut이 있습니다. Aspect는 공통된 관심사를 묶은 모듈로 하나 이상의 됩니다. Pointcut에 의해 Aspect를 적용할 대상이 된 객체를 Target이라고 합니다.

JointPoint는 Aspect가 적용되는 지점입니다. 객체의 생성, 대상의 실행 전, 후 등 다양한 지점이 있고 이에 대한 정보를 Aspect의 파라미터로 전달받아 상황에 맞는 이벤트 처리를 할 수 있습니다. 다만 스프링에서는 메서드 JoinPoint만 제공됩니다.

앞서 정의한 Aspect를 애플리케이션 코드와 연결하는 과정을 Weaving이라고 하며 컴파일시점, 클래스 로딩 시점, 런타임 시점에 적용할 수 있지만 스프링은 런타임 시점에 적용합니다.
:::

::: details Advice 종류에 대해 설명해주세요.
타겟 메소드 실행되기 전 호출되는 @Before, 호출이 끝난 후에 동작하는 @After가 있습니다. After Advice는 좀 더 상세하게 나누어 타겟이 성공적으로 실행됬을 때 실행되는 @AfterReturning와 예외가 발생했을 때 실행되는 @AfterThrowing이 있습니다. 마지막으로 위 기능을 모두 포함하는 @Around도 있습니다.
:::

## References
- 토비의 스프링 3.1 / 이일민 저
- https://gmoon92.github.io/spring/aop/2019/01/15/aspect-oriented-programming-concept.html