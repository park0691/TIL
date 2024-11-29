import{_ as n}from"./toby-ch-06-aop-2-DRR5oues.js";import{_ as s,c as a,o as e,b as i}from"./app-B1D9uFO5.js";const l="/TIL/images/spring/20241017-spring-aop-1.png",p="/TIL/images/spring/20241017-spring-aop-2.png",t="/TIL/images/spring/20241017-spring-aop-3.png",c="/TIL/images/spring/20241017-spring-aop-4.png",o="/TIL/images/spring/20241017-spring-aop-5.png",r="/TIL/images/spring/20241017-spring-aop-6.png",u="/TIL/images/spring/20241017-spring-aop-8.png",d="/TIL/images/spring/20241017-spring-aop-9.png",g="/TIL/images/spring/20241017-spring-aop-7.png",m="/TIL/images/spring/20241017-spring-aop-10.png",v={},k=i('<h1 id="aop" tabindex="-1"><a class="header-anchor" href="#aop"><span>AOP</span></a></h1><h2 id="aop란" tabindex="-1"><a class="header-anchor" href="#aop란"><span>AOP란</span></a></h2><p>메소드나 객체의 기능을 핵심 관심사(Core Concern)와 부가 기능 (or) 공통/횡단 관심사(Cross-cutting Concern)으로 분리하고, <u>부가 기능을 모듈화</u>하여 재사용할 수 있도록 지원하는 프로그래밍 방식</p><p><img src="'+l+'" alt="image"></p><p>여러 클래스에서 발생하는 중복 코드(횡단 관심사)를 별도의 모듈인 Aspect로 분리하고 Aspect를 적용할 메소드나 클래스에 Advice를 적용하여 코드의 재사용성, 유지 보수성을 높인다.</p><h3 id="관심사의-분리" tabindex="-1"><a class="header-anchor" href="#관심사의-분리"><span>관심사의 분리</span></a></h3><p>AOP의 매커니즘은 프로그램을 관심사 기준으로 <code>핵심 관심사</code>와 <code>횡단 관심사</code>로 나눈다.</p><ul><li><p><strong>핵심 관심사(Core Concern)</strong></p><ul><li>비즈니스 로직을 포함하는 기능. 객체가 가져야 할 본래의 기능</li></ul></li><li><p><strong>부가 기능, 공통 관심사, 횡단 관심사(Cross-Cutting Concern)</strong></p><p><img src="'+p+'" alt="image"></p><ul><li>비즈니스 로직은 아니지만 다수의 비즈니스 로직에 포함되는 중복된 코드들(또는 부가 기능)</li><li>주로 인프라 로직 : 보안, 로깅, 트랜잭션, 성능 측정 등</li><li>부가 기능적인 측면에서 보았을 때 코드의 횡단(가로) 영역의 공통된 부분을 추출했다 하여 횡단 관심사 <em><strong>Cross-Cutting Concern</strong></em> 로 부르기도 한다.</li></ul></li></ul><p>횡단 관심사는 비즈니스 로직과 별개이지만 대다수의 비즈니스 로직에 섞여 있어서 비즈니스 로직 코드를 읽기 어렵게 만들고, 코드의 중복으로 유지보수성을 떨어뜨려 테스트하기 어렵게 만들었다.</p><h3 id="oop의-한계" tabindex="-1"><a class="header-anchor" href="#oop의-한계"><span>OOP의 한계</span></a></h3><p>AOP의 목표는 횡단 관심사를 분리하여 모듈화를 증가하는데 목표를 둔다.</p><p>OOP는 객체와 클래스의 초점을 맞춘 프로그래밍 기법이다. OOP의 가장 큰 장점은 상속과 추상화를 통해 기능을 분리하여 기능들을 유연하게 확장할 수 있다.</p><p>따라서 기존 클래스에서 추상화, 템플릿 메소드 패턴을 통해 횡단 관심사를 독립적인 모듈로 분리하여 관리할 수 있다.</p><p>예를 들어 트랜잭션(횡단 관심사)와 비즈니스 로직(핵심 관심사)가 공존하는 UserService 클래스가 있다고 하자. 우선적으로 기존 클래스에서 횡단 관심사와 핵심 관심사를 분리한다.</p><p><img src="'+n+`" alt="image"></p><ul><li>UserService : 추상화된 비즈니스 모듈</li><li>UserServiceImpl : 비즈니스 모듈 (핵심 관심사)</li><li>UserServiceTx : 트랜잭션 모듈 (횡단 관심사)</li></ul><p>분리된 핵심 관심사는 UserServiceImpl로 모듈화되어 관리하기 때문에 순수 비즈니스 로직에만 충실하게 되어 코드가 직관적이며 유지보수성이 좋아진다.</p><div class="language-java line-numbers-mode" data-highlighter="prismjs" data-ext="java" data-title="java"><pre><code><span class="line"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">UserServiceTx</span> <span class="token keyword">implements</span> <span class="token class-name">UserService</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token class-name">UserService</span> userService<span class="token punctuation">;</span></span>
<span class="line">    <span class="token class-name">PlatformTransactionManager</span> transactionManager<span class="token punctuation">;</span></span>
<span class="line">	</span>
<span class="line">	<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span></span>
<span class="line">	</span>
<span class="line">    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">upgradeLevels</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token class-name">TransactionStatus</span> status <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>transactionManager</span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">getTransaction</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">DefaultTransactionDefinition</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">try</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token comment">// Business Logic (DI 받은 UserService 오브젝트에 모든 기능을 위임)</span></span>
<span class="line">            userService<span class="token punctuation">.</span><span class="token function">upgradeLevels</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">            <span class="token keyword">this</span><span class="token punctuation">.</span>transactionManager<span class="token punctuation">.</span><span class="token function">commit</span><span class="token punctuation">(</span>status<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">RuntimeException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token keyword">this</span><span class="token punctuation">.</span>transactionManager<span class="token punctuation">.</span><span class="token function">rollback</span><span class="token punctuation">(</span>status<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">            <span class="token keyword">throw</span> e<span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>UserServiceTx에서 비즈니스 로직에 트랜잭션 기능을 추가했다. 유연한 기능의 확장을 위해 UserService 인터페이스에 의존한다.</p><p>의존성 주입을 통해 UserService에 UserServiceTx를 주입하고, UserServiceTx에 UserServiceImpl을 주입하여 의존성을 만들어줌으로써 기존 클래스와 동일하게 비즈니스 로직 호출 시 트랜잭션이 호출된다.</p><p>하지만 다음과 같은 한계가 있다.</p><ol><li>다른 클래스의 메소드에 적용해야 한다면 → 적용할 다른 클래스의 추상화 클래스를 또 만들어야 한다.</li><li>다른 횡단 관심사를 적용해야 한다면 → 추상화 클래스를 구현한 또다른 구체 클레스를 만들어야 하며, <u>의존 관계도 복잡</u>해 질 것이다.</li></ol><p>공통된 횡단 관심사를 재사용하기 위해 추상화, 상속, 위임을 사용했지만 전체 애플리케이션 여기저기에서 부가 기능이 사용되거나 적용해야할 부가 기능이 많아진다면 문제가 발생한다.</p><p><img src="`+t+'" alt="image"></p><p>횡단 관심사를 적용해야 할 클래스가 많아지면 매우 많은 추상화 클래스가 생기게 되고, 적용해야 할 횡단 관심사가 많아진다면 의존 관계도 복잡해진다. 추상화 클래스의 본질적인 장점과 다르게 오히려 이를 관리하는데 더 많은 비용이 들게 된다.</p><h3 id="aop의-필요성" tabindex="-1"><a class="header-anchor" href="#aop의-필요성"><span>AOP의 필요성</span></a></h3><p>이러한 OOP의 한계점들을 보완하고자 등장한 기술이 AOP다.</p><ul><li>횡단 관심사의 모듈화</li><li>효율적인 횡단 관심사 모듈 관리</li></ul><p><img src="'+c+'" alt="image"></p><p>분리된 횡단 관심사를 Aspect로 모듈화한다. 자체적으로 횡단 관심사를 여러 객체의 핵심 기능에 교차로 적용해 주기 때문에 추상화를 통해 분리하는 작업도 필요가 없어진다. 따라서 횡단 관심사 모듈을 효율적으로 관리할 수 있다.</p><h3 id="장점" tabindex="-1"><a class="header-anchor" href="#장점"><span>장점</span></a></h3><ul><li>로깅, 트랜젝션, 보안, 캐싱 등과 같은 공통 관심사를 모듈화하여 <u>중복 코드의 제거, 코드의 유지보수성을 향상</u>시킨다. <ul><li>여러 곳에서 사용되는 중복 코드를 한 곳에서 유지하고 관리할 수 있는 이점</li><li>코드 재사용성 극대화</li></ul></li><li>핵심 로직과 부가 기능의 명확한 분리 → 개발자가 핵심 로직을 개발할 때 자신의 목적 외의 부가 기능은 신경 쓰지 않고 개발에 집중할 수 있다.</li></ul><h3 id="spring-aop" tabindex="-1"><a class="header-anchor" href="#spring-aop"><span>Spring AOP</span></a></h3><ul><li>스프링 프레임워크에서 관점 지향 프로그래밍을 지원하는 기술 <ul><li>스프링 빈에만 AOP 적용 가능</li></ul></li><li><strong>프록시 패턴 기반의 AOP 구현체</strong><ul><li>Spring은 <u>Target 객체에 대한 <strong>프록시를 만들어서 제공</strong></u>한다.</li><li>프록시는 Advice를 타겟 객체에 적용하면서 생성되는 객체</li></ul></li><li>런타임 위빙 <ul><li>타겟을 감싸는 프록시는 런타임에 생성된다.</li></ul></li><li><strong>프록시가 호출을 가로챈다 (Intercept)</strong><ul><li>전처리 어드바이스 : 프록시는 타겟 객체에 대한 호출을 가로챈 다음 Advice의 부가 기능 로직을 수행한 후에 타겟의 핵심 기능 로직을 호출한다.</li><li>후처리 어드바이스 : 타겟의 핵심 기능 로직 메소드를 호출한 후에 부가 기능을 수행하는 경우도 있다.</li></ul></li><li><strong>메소드 JoinPoint만 지원한다.</strong><ul><li>Spring은 동적 프록시를 기반으로 AOP를 구현하므로 메소드 조인 포인트만 지원</li><li><strong>타겟의 메소드가 호출되는 런타임 시점에만 부가기능(어드바이스) 적용 가능</strong></li><li>반면, AspectJ같은 고급 AOP 프레임워크를 사용하면 객체의 생성, 필드 값의 조회와 조작, static 메소드 호출 및 동기화 등의 다양한 작업에 부가 기능을 적용할 수 있다.</li></ul></li></ul><h2 id="주요-개념" tabindex="-1"><a class="header-anchor" href="#주요-개념"><span>주요 개념</span></a></h2><p>AOP의 핵심은 프로그램을 핵심 관심사, 횡단 관심사로 분리하고 분리된 관심사는 모듈성을 가져야 한다는 것이다.</p><p>AOP의 개발 방식은 핵심 관심사를 Object로 횡단 관심사는 Aspect로 모듈화하여 각각 다른 영역으로 개발한다.</p><p><img src="'+o+'" alt="image"></p><h3 id="용어" tabindex="-1"><a class="header-anchor" href="#용어"><span>용어</span></a></h3><ul><li><strong>Target</strong><ul><li>[<strong>어떤 클래스에 부가 기능을 부여할 것인가?</strong>]</li><li>핵심 기능을 담고 있는 모듈로, 부가 기능을 부여할 대상</li></ul></li><li><strong>Join Point</strong><ul><li>[<strong>어디에 적용할 것인가?</strong> <em>메서드, 필드, 객체, 생성자</em>] <ul><li>예외가 발생하거나 / 필드가 수정될 때 / 객체가 생성될 때 / 메서드가 호출될 때</li></ul></li><li>(Target Object 안에서) Advice가 적용될 위치</li><li>일반적으로 AspectJ는 모든 JoinPoint에 접근 가능하지만 Spring AOP는 기본적으로 Method Interceptor를 기반하고 있어서 JoinPoint는 항상 메소드 단위다.</li></ul></li><li><strong>Advice</strong><img src="'+r+'" alt="image"><ul><li>[<strong>어떤 부가 기능을 부여할 것인가?</strong>]</li><li>부가 기능을 담은 구현체, JoinPoint에서 적용할 (횡단 관심사) 코드</li><li>타겟 오브젝트에 종속되지 않기 때문에 부가 기능에만 집중할 수 있음</li></ul></li><li><strong>Point Cut</strong><img src="'+u+'" alt="image"><ul><li>[<strong>실제 Advice가 적용될 지점</strong>]</li><li>Advice는 여러 JoinPoint 중에서 포인트컷의 표현식에 명시된 조인 포인트에서 실행된다.</li><li>Spring AOP에서는 Advice가 적용될 메서드를 선정</li></ul></li><li><strong>Aspect</strong><img src="'+d+'" alt="image"><ul><li><em><strong>Point Cut + Advice를 모듈화한 것</strong></em></li></ul></li><li><strong>Weaving</strong><ul><li>핵심 로직 코드(<em>Target의 JoinPoint</em>)에 Advice를 적용하는 것</li></ul></li><li><strong>Proxy</strong><ul><li>Aspect를 대신 수행하기 위해 AOP 프레임워크에 의해 생성된 객체</li><li>Target을 감싸서 Target의 요청을 대신 받아주는 랩핑 오브젝트</li><li>클라이언트에서 Target을 호출하면 타겟이 아닌, 타겟을 감싸는 Proxy가 호출되어 타겟 메소드 실행 전에 선처리, 후처리를 실행한다.</li></ul></li></ul><h3 id="advice-종류" tabindex="-1"><a class="header-anchor" href="#advice-종류"><span>Advice 종류</span></a></h3><p><img src="'+g+`" alt="image"></p><p>Spring AOP는 JoinPoint와 횡단 코드의 결합점을 제어하도록 다양한 Advice를 제공한다.</p><ul><li>Before : 메서드 호출 전에 동작</li><li>AfterReturning : <strong><u>예외 없이</u></strong> 호출된 메서드 실행 후 동작 <ul><li><code>returning</code> 속성으로 리턴 값 받아올 수 있음</li></ul></li><li>AfterThrowing : 메서드 실행 중 <u><strong>예외가 발생</strong></u>했을 때 동작 <ul><li><code>throwing</code> 속성 값으로 예외 받아올 수 있음</li></ul></li><li>After : (<strong><u>예외 발생 여부 관계없이</u></strong>) 호출된 메서드 실행 후 동작</li><li>Around : 메서드 실행 전/후에 동작 <ul><li>리턴 타입 <code>Object</code>, 첫번째 파라미터로 <code>ProceedingJoinPoint</code></li><li><code>joinPoint.proceed()</code> 반드시 실행</li><li>타겟의 전/후, 심지어 예외 처리를 모두 정의할 수 있기 때문에 자유도가 높다.</li></ul></li><li>Around를 제외한 4가지 Advice는 리턴 타입이 <code>void</code>, 첫 번째 파라미터로 <code>JoinPoint</code></li><li><em><strong>Around → Before → [Logic] → AfterReturning → After → Around</strong></em></li><li><em><strong>Around → Before → [Logic] → AfterThrowing → After</strong></em></li></ul><h3 id="advice-순서" tabindex="-1"><a class="header-anchor" href="#advice-순서"><span>Advice 순서</span></a></h3><ul><li>Advice는 순서를 보장하지 않는다.</li><li><code>@Aspect</code> 단위로 순서를 지정하고 싶다면 <code>@Order</code> 를 사용한다. (클래스 단위) <ul><li>한 Aspect 클래스에 여러 Advice의 순서를 지정할 수 없으므로 별도의 Aspect 클래스로 분리해야 한다.</li></ul></li><li>클래스 레벨에 <code>@Aspect</code> 어노테이션을 선언하고, <code>@Around</code> 어노테이션이 붙은 메소드를 선언하면 하나의 Advisor가 완성된다.</li><li>스프링 AOP의 빈 후처리기 <code>AnnotationAwareAspectJAutoProxyCreator</code> 가 <code>@Aspect</code>로 적용된 클래스들을 찾아서 Advisor로 등록해준다. 즉, 스프링 AOP의 빈 후처리기는 스프링 빈으로 등록된 Advisor 뿐만 아니라 <code>@Aspect</code> 어노테이션도 찾아서 Advisor로 변환하고 프록시를 생성한다.</li></ul><h3 id="weaving-종류" tabindex="-1"><a class="header-anchor" href="#weaving-종류"><span>Weaving 종류</span></a></h3><ul><li>Compile Time Weaving, CTW <ul><li>AspectJ에는 AJC(AspectJ Compiler) 컴파일러가 있는데, Java Compiler를 확장한 형태의 컴파일러이다.</li><li>ABC.java → ABC.class로 <u>컴파일할 때 바이트 코드 조작</u>을 통해 해당 Advisor 코드를 직접 끼워 넣는다.</li><li>가장 빠른 퍼포먼스</li><li>하지만 lombok과 같이 컴파일 과정에서 코드를 조작하는 플러그인과 충돌 발생할 가능성이 아주 높다.</li></ul></li><li>Runtime Weaving, RTW <ul><li>Spring AOP에서 사용하는 방식으로 프록시 객체를 생성해 실제 타겟 객체에 영향을 주지 않고 위빙을 수행한다.</li><li>실제 런타임에 메소드 호출 시 위빙이 이루어진다.</li><li>소스 코드, 클래스 파일에 변형이 없는 장점이 있지만 포인트 컷에 대한 Advice 수가 늘어날 수록 성능이 떨어지는 단점</li></ul></li><li>Load Time Weaving, LTW <ul><li>런타임에 <u>클래스 로더가 클래스를 JVM에 로드할 때</u> 위빙한다.</li><li>AspectJ Weaver를 클래스 로더에 연결하여 클래스가 로드될 때 바이트 코드를 조작하여 Aspect를 주입한다.</li><li>컴파일 시간은 상대적으로 Comple Time Weaving보다 짧지만, 오브젝트가 메모리에 올라가는 과정에서 위빙이 발생하기 때문에 <u>런타임 시간은 Compile Time Weaving보다 상대적으로 느리다</u>.</li><li>ApplicationContext에 객체가 로드될 때 객체 핸들링이 발생하므로 퍼포먼스 저하</li></ul></li></ul><h2 id="proxy" tabindex="-1"><a class="header-anchor" href="#proxy"><span>Proxy</span></a></h2><p>Spring AOP는 핵심 코드를 건드리지 않고 Proxy 객체를 기반으로 동작하는 AOP를 제공한다. 결과적으로 횡단 관심사 모듈과 핵심 관심사 모듈 객체의 느슨한 결합 구조를 만들어서 <u>부가 기능을 탈부착하기 쉽게 해준다</u>.</p><ul><li>생성 시점 : 스프링 애플리케이션을 실행하면 스프링 컨테이너와 스프링 빈을 등록하는 시점에 프록시를 생성해서 스프링 빈으로 등록한다. 이 시점에 포인트컷을 확인해서 프록시를 생성한다.</li></ul><p>스프링은 런타임에 Weaving하는 <code>JDK Dynamic Proxy</code>, <code>CGLIB</code> 방식으로 프록시 객체를 생성한다.</p><h3 id="jdk-dynamic-proxy" tabindex="-1"><a class="header-anchor" href="#jdk-dynamic-proxy"><span>JDK Dynamic Proxy</span></a></h3><ul><li>Java의 리플랙션 패키지의 <code>Java.lang.reflect.Proxy</code> 클래스를 통해 생성되는 프록시 객체를 의미한다.</li><li>리플렉션의 프록시 클래스가 동적으로 프록시를 생성해주기 때문에 JDK Dynamic Proxy라 불린다.</li><li><u>타깃의 인터페이스를 기준으로 프록시를 생성</u>해준다.</li></ul><p><strong>[Proxy 생성]</strong></p><div class="language-java line-numbers-mode" data-highlighter="prismjs" data-ext="java" data-title="java"><pre><code><span class="line"><span class="token class-name">Object</span> proxy <span class="token operator">=</span> <span class="token class-name">Proxy</span><span class="token punctuation">.</span><span class="token function">newProxyInstance</span><span class="token punctuation">(</span></span>
<span class="line">    <span class="token class-name">ClassLoader</span><span class="token punctuation">,</span>		<span class="token comment">// 클래스 로더</span></span>
<span class="line">    <span class="token class-name">Class</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token operator">?</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>			<span class="token comment">// 타깃의 인터페이스</span></span>
<span class="line">    <span class="token class-name">InvocationHandler</span>	<span class="token comment">// 부가 기능과 위임 코드를 담은 InvocationHandler</span></span>
<span class="line"><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>InvocationHandler.invoke()</code> 인터페이스 메소드에 부가 기능과 위임 코드를 담는다.</p><p>핵심은 인터페이스를 기준으로 프록시를 생성한다는 점이다. 따라서 구현체는 인터페이스를 상속받아야 하고, 주입받는 필드의 객체는 인터페이스의 타입으로 지정해야 한다.</p><p><strong>[클래스를 사용한다면]</strong></p><div class="language-java line-numbers-mode" data-highlighter="prismjs" data-ext="java" data-title="java"><pre><code><span class="line"><span class="token annotation punctuation">@Controller</span></span>
<span class="line"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">UserController</span><span class="token punctuation">{</span></span>
<span class="line">    <span class="token annotation punctuation">@Autowired</span></span>
<span class="line">    <span class="token keyword">private</span> <span class="token class-name">UserServiceImpl</span> userService<span class="token punctuation">;</span>	<span class="token comment">// Runtime Error 발생</span></span>
<span class="line">    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token annotation punctuation">@Service</span></span>
<span class="line"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">UserServiceImpl</span> <span class="token keyword">implements</span> <span class="token class-name">UserService</span><span class="token punctuation">{</span></span>
<span class="line">    <span class="token annotation punctuation">@Override</span></span>
<span class="line">    <span class="token keyword">public</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">Object</span><span class="token punctuation">&gt;</span></span> <span class="token function">findUserId</span><span class="token punctuation">(</span><span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">Object</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">)</span><span class="token punctuation">{</span></span>
<span class="line">        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>isLogic</span>
<span class="line">        <span class="token keyword">return</span> params<span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>UserServiceImpl 클래스는 인터페이스를 상속받고 있기 때문에 JDK Dynamic Proxy 방식으로 프록시 빈을 생성할 때 Runtime Exception이 발생한다. 인터페이스 타입으로 DI를 받아주어야 하기 때문에 <code>private UserService userService</code>로 변경해주어야 한다.</p><p><strong>[장점]</strong></p><ul><li>자바 표준 라이브러리를 사용하여 외부 라이브러리가 필요 없고 성능도 비교적 가볍다.</li></ul><p><strong>[단점]</strong></p><ul><li>타겟 객체의 구현 클래스로 프록시를 생성할 수 없다.</li></ul><h3 id="cglib-code-generator-library" tabindex="-1"><a class="header-anchor" href="#cglib-code-generator-library"><span>CGLIB, Code Generator Library</span></a></h3><ul><li>클래스의 바이트코드를 조작해서 동적으로 프록시 객체를 생성해 주는 라이브러리 <ul><li>바이트코드 조작을 통해 <u>동적으로 클래스를 상속 받아 메서드를 오버라이딩하는 방식</u>으로 AOP를 적용한다.</li></ul></li><li>JDK Dynamic Proxy와 다르게 <u>인터페이스 없이 클래스만으로 프록시를 만들 수 있다</u>.</li></ul><p><strong>[Proxy 생성]</strong></p><div class="language-java line-numbers-mode" data-highlighter="prismjs" data-ext="java" data-title="java"><pre><code><span class="line"><span class="token class-name">Enhancer</span> enhancer <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Enhancer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">enhancer<span class="token punctuation">.</span><span class="token function">setSuperclass</span><span class="token punctuation">(</span><span class="token class-name">MemberService</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span> 	<span class="token comment">// 타깃 클래스</span></span>
<span class="line">enhancer<span class="token punctuation">.</span><span class="token function">setCallback</span><span class="token punctuation">(</span><span class="token class-name">MethodInterceptor</span><span class="token punctuation">)</span><span class="token punctuation">;</span>     	<span class="token comment">// Handler</span></span>
<span class="line"><span class="token class-name">Object</span> proxy <span class="token operator">=</span> enhancer<span class="token punctuation">.</span><span class="token function">create</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> 				<span class="token comment">// Proxy 생성</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>Enhancer</code> 클래스를 통해 타깃의 클래스를 상속받아 프록시를 생성한다.</p><p><code>MethodInterceptor.intercept()</code> 인터페이스 메소드에 부가 기능과 위임 코드를 담는다.</p><p><strong>[장점]</strong></p><ul><li>더 유연하다. 인터페이스 없이 <u>단순 클래스만으로 프록시를 생성</u>할 수 있다.</li><li>리플렉션이 아닌 바이트 코드 조작을 사용하며, 타겟에 대한 정보를 알고 있기 때문에 <u>JDK 다이나믹 프록시에 비해 빠르다.</u><ul><li>메서드가 처음 호출되었을 때 동적으로 타깃 클래스의 바이트 코드를 조작</li><li>이후 호출 시 조작된 바이트 코드를 재사용</li></ul></li></ul><p><strong>[단점]</strong></p><ul><li>상속받아 프록시를 생성하기 때문에 <u><code>final</code>을 사용하는 클래스, 메서드를 사용할 수 없다</u>.</li><li><code>net.sf.cglib.proxy.Enhancer</code> 의존성 별도로 추가해야 함 <ul><li>Spring 3.2부터 CGLIB를 Spring Core 패키지에 포함시켜 더 이상 의존성 추가할 필요 X</li></ul></li><li>기본 생성자 필수 <ul><li>CGLIB 프록시는 타겟 클래스를 상속 받고, 부모 클래스의 기본 생성자 호출하기 때문</li><li>Spring 4.0부터 Objensis 라이브러리의 도움을 받아서 기본 생성자 생성할 필요 X</li></ul></li><li>생성자 2번 호출 <ul><li>Target 객체 생성 시 1번, 프록시 객체를 생성 시 부모 클래스 생성자 1번 호출</li><li>Spring 4.0부터 Objensis 라이브러리의 도움을 받아서 생성자 2번 호출할 필요 X</li></ul></li></ul><h3 id="spring의-프록시-메커니즘" tabindex="-1"><a class="header-anchor" href="#spring의-프록시-메커니즘"><span>Spring의 프록시 메커니즘</span></a></h3><p>스프링 AOP는 JDK 다이나믹 프록시 또는 CGLIB를 사용하여 프록시 객체를 생성한다.</p><p><img src="`+m+'" alt="image"></p><ul><li>타겟이 하나 이상의 인터페이스를 구현한 클래스라면 → JDK Dynamic Proxy 방식으로 프록시 생성</li><li>인터페이스를 구현하지 않은 클래스라면 → CGLIB 방식으로 프록시 생성</li><li>스프링 부트 2.0, 스프링 프레임워크 4.3부터 Default 프록시로 CGLIB 방식을 사용한다. <ul><li><code>spring.aop.proxy-target-class=true (default)</code><br> (CGLIB 프록시 사용을 강제하는 속성 값이다.)</li></ul></li></ul><details class="custom-container details"><summary>AOP는 무엇이고 왜 사용할까요?</summary><p>AOP는 부가 기능을 핵심 기능에서 분리하고 모듈화하여 한 곳에서 관리하고, 이 부가 기능을 어디에 적용할지 선택하도록 하는 프로그래밍 방식입니다.</p><p>애플리케이션 로직은 크게 객체가 제공하는 고유의 기능인 핵심 기능과, 핵심 기능을 도와주는 부가 기능으로 나눈다. 부가 기능은 로깅, 트랜잭션 같은 것들, …</p><p>보통 기존 프로젝트에 부가 기능, 로깅을 추가한다면, 한 클래스가 아니라 여러 곳에 동일하게 사용한다. → 이렇게 되면 문제점이 발생하는데, 부가 기능을 적용해야 할 클래스가 100개라면 100개에 모두 똑같은 부가 기능 코드를 추가해야 하므로 매우 복잡하다. 추가할 때도 복잡하지만, 만약 수정이 필요하다면 100개의 클래스를 모두 뜯어 고쳐야 하므로 효율적이지 못한 문제가 있다.</p><p>AOP의 A에 해당하는 Aspect는 관점이라는 뜻으로, 말 그대로, 애플리케이션을 보는 관점을 횡단 관심사의 관점으로 달리 보는 방식을 말하며, 이러한 프로그래밍 방식을 관점 지향 프로그래밍이라고 합니다.</p><p>AOP를 통해 핵심 기능과 부가 기능을 명확히 분리하여, 코드의 재사용성과 유지 보수성을 높이고, 핵심 로직은 부가 기능에 신경쓰지 않고 본연의 기능에만 충실할 수 있는 장점이 있습니다.</p></details><details class="custom-container details"><summary>AOP를 구현할 때 Advice, Pointcut 같은 용어를 사용합니다. 어떤 것들을 알고 계신가요?</summary><p>먼저 처리될 지점과 무엇을 처리할 것인지 정의한 Advice와 어느 대상에게 Advice를 적용할지 표현하는 PointCut이 있습니다. Aspect는 공통된 관심사를 묶은 모듈로 하나 이상의 됩니다. Pointcut에 의해 Aspect를 적용할 대상이 된 객체를 Target이라고 합니다.</p><p>JointPoint는 Aspect가 적용되는 지점입니다. 객체의 생성, 대상의 실행 전, 후 등 다양한 지점이 있고 이에 대한 정보를 Aspect의 파라미터로 전달받아 상황에 맞는 이벤트 처리를 할 수 있습니다. 다만 스프링에서는 메서드 JoinPoint만 제공됩니다.</p><p>앞서 정의한 Aspect를 애플리케이션 코드와 연결하는 과정을 Weaving이라고 하며 컴파일시점, 클래스 로딩 시점, 런타임 시점에 적용할 수 있지만 스프링은 런타임 시점에 적용합니다.</p></details><details class="custom-container details"><summary>Advice 종류에 대해 설명해주세요.</summary><p>타겟 메소드 실행되기 전 호출되는 @Before, 호출이 끝난 후에 동작하는 @After가 있습니다. After Advice는 좀 더 상세하게 나누어 타겟이 성공적으로 실행됬을 때 실행되는 @AfterReturning와 예외가 발생했을 때 실행되는 @AfterThrowing이 있습니다. 마지막으로 위 기능을 모두 포함하는 @Around도 있습니다.</p></details><details class="custom-container details"><summary>JDK Dynamic Proxy, CGLIB 두 방식의 차이, 장단점 비교</summary><p>JDK 다이나믹 프록시와 CGLIB 프록시의 주요 차이는 프록시 객체를 생성하는 방법에 있습니다. JDK 동적 프록시는 자바 리플랙션 패키지 Proxy 클래스를 통해 인터페이스를 구현하여 프록시 객체를 생성합니다. 반면, CGLIB는 실제 클래스를 상속받은 클래스를 통해 프록시 객체를 생성합니다. 따라서 JDK 다이나믹 프록시에서 인터페이스로만 프록시를 만들 수 있었지만, CGLIB에서는 클래스로도 프록시를 만들 수 있는 장점이 있습니다.</p><p>또한 JDK 동적 프록시는 리플렉션을 통해 프록시 객체를 만들지만 CGLIB는 실제 클래스의 바이트코드를 조작하여 프록시 객체를 생성합니다.</p></details><h2 id="references" tabindex="-1"><a class="header-anchor" href="#references"><span>References</span></a></h2><ul><li>토비의 스프링 3.1 / 이일민 저</li><li>https://gmoon92.github.io/spring/aop/2019/01/15/aspect-oriented-programming-concept.html</li><li>https://gmoon92.github.io/spring/aop/2019/04/20/jdk-dynamic-proxy-and-cglib.html</li><li>https://www.inflearn.com/community/questions/359627</li><li>https://docs.spring.io/spring-framework/reference/core/aop/proxying.html</li></ul>',85),h=[k];function A(b,y){return e(),a("div",null,h)}const x=s(v,[["render",A],["__file","aop.html.vue"]]),O=JSON.parse('{"path":"/spring/aop.html","title":"AOP","lang":"en-US","frontmatter":{},"headers":[{"level":2,"title":"AOP란","slug":"aop란","link":"#aop란","children":[{"level":3,"title":"관심사의 분리","slug":"관심사의-분리","link":"#관심사의-분리","children":[]},{"level":3,"title":"OOP의 한계","slug":"oop의-한계","link":"#oop의-한계","children":[]},{"level":3,"title":"AOP의 필요성","slug":"aop의-필요성","link":"#aop의-필요성","children":[]},{"level":3,"title":"장점","slug":"장점","link":"#장점","children":[]},{"level":3,"title":"Spring AOP","slug":"spring-aop","link":"#spring-aop","children":[]}]},{"level":2,"title":"주요 개념","slug":"주요-개념","link":"#주요-개념","children":[{"level":3,"title":"용어","slug":"용어","link":"#용어","children":[]},{"level":3,"title":"Advice 종류","slug":"advice-종류","link":"#advice-종류","children":[]},{"level":3,"title":"Advice 순서","slug":"advice-순서","link":"#advice-순서","children":[]},{"level":3,"title":"Weaving 종류","slug":"weaving-종류","link":"#weaving-종류","children":[]}]},{"level":2,"title":"Proxy","slug":"proxy","link":"#proxy","children":[{"level":3,"title":"JDK Dynamic Proxy","slug":"jdk-dynamic-proxy","link":"#jdk-dynamic-proxy","children":[]},{"level":3,"title":"CGLIB, Code Generator Library","slug":"cglib-code-generator-library","link":"#cglib-code-generator-library","children":[]},{"level":3,"title":"Spring의 프록시 메커니즘","slug":"spring의-프록시-메커니즘","link":"#spring의-프록시-메커니즘","children":[]}]},{"level":2,"title":"References","slug":"references","link":"#references","children":[]}],"git":{"updatedTime":1731490516000,"contributors":[{"name":"depark","email":"mem29238@gmail.com","commits":2}]},"filePathRelative":"spring/aop.md"}');export{x as comp,O as data};