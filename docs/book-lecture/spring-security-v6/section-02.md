# 초기화 과정

::: warning 정리
WebSecurity는 FilterChainProxy를 만드는 것이 목적이고, 그 안에는 SecurityFilterChain이 들어가야 한다. 이 필터들을 통해 클라이언트의 요청을 처리한다. 그 필터들은 HttpSecurity가 만들었다.

HttpSecurity는 SecurityConfigurer 구현체를 통해 보안을 위한 각종 Filter를 만들고 만들어낸 여러 필터들을 담은 SecurityFilterChain을 만들어낸다.

DelegatingFilterProxy는 스프링 컨테이너와 서블릿 사이의 연결 고리 역할을 하는 필터 클래스로 스프링 애플리케이션 컨텍스트를 찾아내고 FilterChainProxy를 읽어온다. 실제로 중요한 보안 역할을 하는 클래스는 FilterChainProxy
:::

## 기본 보안을 위한 자동 설정
```java
package org.springframework.boot.autoconfigure.security.servlet;

@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = Type.SERVLET)
class SpringBootWebSecurityConfiguration {

	@Configuration(proxyBeanMethods = false)
	@ConditionalOnDefaultWebSecurity
	static class SecurityFilterChainConfiguration {

		@Bean
		@Order(SecurityProperties.BASIC_AUTH_ORDER)
		SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
			// 기본적으로 모든 요청에 대해 인증 여부를 검증한다.
			http.authorizeHttpRequests((requests) -> requests.anyRequest().authenticated());
			// 인증 방식은 폼 로그인 방식과
			http.formLogin(withDefaults());
			// httpBasic 로그인 방식을 제공한다.
			http.httpBasic(withDefaults());
			return http.build();
		}
	}
...
```
다음 자동 설정 클래스에 의해 서버가 기동되면 스프링 시큐리티의 초기화 작업 및 보안 설정이 진행된다.

**[문제점]**

- 계정 추가나 권한 추가시 문제
- 더 세부적이고 추가적인 보안 기능이 제공되지 않음

인증 승인이 이루어질 수 있도록 한 개의 계정이 기본 제공된다.
```java
@ConfigurationProperties(prefix = "spring.security")
public class SecurityProperties {
	public static class User {
        private String name = "user";
        private String password = UUID.randomUUID().toString();
        ...
	}
    ...
}
```
`SecurityProperties` 설정 클래스에서 기본 계정이 생성된다.
- username : user
- password : 랜덤 문자열


## SecurityBuilder, SecurityConfigurer

![image](/images/lecture/spring-security-s2-1.png)

- `SecurityBuilder`는 웹 보안을 구성하는 빈 객체와 설정 클래스를 생성하는 빌더 클래스
	- 대표적으로 `WebSecurity, HttpSecurity` 구현체가 있다.
	- `SecurityConfigurer`를 사용하며 인증 및 인가 초기화 작업은 `SecurityConfigurer`에 의해 진행된다.
- `SecurityConfigurer`는 HTTP 요청과 관련된 보안 처리를 담당하는 필터들을 생성하고 여러 초기화 설정에 관여한다.

![image](/images/lecture/spring-security-s2-2.png)

HttpSecurity가 SecurityConfigurer 구현체(e.g. LogoutConfigurer)를 생성한다.
해당 클래스의 init, configure 메소드를 통해 초기화 작업이 일어나서 Filter(e.g. LogoutFilter)를 생성한다.

각 SecurityConfigurer 구현체들은 특정 보안에 관련된 필터를 생성한다.

**[SecurityBuilder]**

```java
public interface SecurityBuilder<O> {
	O build() throws Exception;
}
```
- 오브젝트를 빌드하는 빌더 클래스임을 알 수 있다.

**[SecurityConfigurer]**

```java
public interface SecurityConfigurer<O, B extends SecurityBuilder<O>> {
    void init(B builder) throws Exception;
    void configure(B builder) throws Exception;
}
```
- Builder를 매개변수로 받는다.

**[HttpSecurityConfiguration]**

HttpSecurity 빈 생성 메소드 `HttpSecurityConfiguration.httpSecurity()`

```java
@Bean(HTTPSECURITY_BEAN_NAME)
@Scope("prototype")
HttpSecurity httpSecurity() throws Exception {
    LazyPasswordEncoder passwordEncoder = new LazyPasswordEncoder(this.context);
    AuthenticationManagerBuilder authenticationBuilder = new DefaultPasswordEncoderAuthenticationManagerBuilder(
            this.objectPostProcessor, passwordEncoder);
    authenticationBuilder.parentAuthenticationManager(authenticationManager());
    authenticationBuilder.authenticationEventPublisher(getAuthenticationEventPublisher());
    HttpSecurity http = new HttpSecurity(this.objectPostProcessor, authenticationBuilder, createSharedObjects());
    WebAsyncManagerIntegrationFilter webAsyncManagerIntegrationFilter = new WebAsyncManagerIntegrationFilter();
    webAsyncManagerIntegrationFilter.setSecurityContextHolderStrategy(this.securityContextHolderStrategy);
    // @formatter:off
    http
        .csrf(withDefaults())
        .addFilter(webAsyncManagerIntegrationFilter)
        .exceptionHandling(withDefaults())
        .headers(withDefaults())
        .sessionManagement(withDefaults())
        .securityContext(withDefaults())
        .requestCache(withDefaults())
        .anonymous(withDefaults())
        .servletApi(withDefaults())
        .apply(new DefaultLoginPageConfigurer<>());
    http.logout(withDefaults());
    // @formatter:on
    applyCorsIfAvailable(http);
    applyDefaultConfigurers(http);
    return http;
}
```
prototype 스코프 → 싱글톤 빈이 아니라 HttpSecurity 생성할 때마다 빈이 생성됨

```java
.csrf(withDefaults())
```

다음 메소드를 보면
```java
public HttpSecurity csrf(Customizer<CsrfConfigurer<HttpSecurity>> csrfCustomizer) throws Exception {
    ApplicationContext context = getContext();
    csrfCustomizer.customize(getOrApply(new CsrfConfigurer<>(context)));
    return HttpSecurity.this;
}
```

CsrfConfigurer 클래스를 이용하여 설정하는데 이 클래스는 <u>SecurityConfigurer를 상속받는다</u>.
```java
public abstract class SecurityConfigurerAdapter<O, B extends SecurityBuilder<O>> implements SecurityConfigurer<O, B> {
```

초기화 작업 때 Configurer 클래스를 생성해서 초기화 작업하는 것을 알 수 있다.

마찬가지로,

```java
.exceptionHandling(withDefaults())
```
메소드를 보면

```java
public HttpSecurity exceptionHandling(
        Customizer<ExceptionHandlingConfigurer<HttpSecurity>> exceptionHandlingCustomizer) throws Exception {
    exceptionHandlingCustomizer.customize(getOrApply(new ExceptionHandlingConfigurer<>()));
    return HttpSecurity.this;
}
```

마찬가지로 ExceptionHandlingConfigurer 클래스를 이용하여 설정한다.

이 과정을 통해 HttpSecurity 빈을 생성해서 반환한다.

반환된 빈을 주입받아 초기화하는 클래스는 `SpringBootWebSecurityConfiguration`에 있다.

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = Type.SERVLET)
class SpringBootWebSecurityConfiguration {

	@Configuration(proxyBeanMethods = false)
	@ConditionalOnDefaultWebSecurity
	static class SecurityFilterChainConfiguration {

		@Bean
		@Order(SecurityProperties.BASIC_AUTH_ORDER)
		SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
			http.authorizeHttpRequests((requests) -> requests.anyRequest().authenticated());
			http.formLogin(withDefaults());
			http.httpBasic(withDefaults());
			return http.build();
		}

	}
...
```

여기서의 HttpSecurity 빈을 디버깅으로 살펴보면 많은 configurer들이 들어와 있는 것을 확인할 수 있다.

![image](/images/lecture/spring-security-s2-3.png)

위 메소드에서 http의 각 메소드가 실행될 때마다 Configurer들이 생성되어서 configurers에 추가된다.

```java
public HttpSecurity formLogin(Customizer<FormLoginConfigurer<HttpSecurity>> formLoginCustomizer) throws Exception {
    formLoginCustomizer.customize(getOrApply(new FormLoginConfigurer<>()));
    return HttpSecurity.this;
}

public HttpSecurity httpBasic(Customizer<HttpBasicConfigurer<HttpSecurity>> httpBasicCustomizer) throws Exception {
    httpBasicCustomizer.customize(getOrApply(new HttpBasicConfigurer<>()));
    return HttpSecurity.this;
}
```
이 메소드들이 전부 실행된 후

![image](/images/lecture/spring-security-s2-4.png)

configurers 안의 Configurer가 3개 더 늘어난 것을 확인할 수 있다.

설정 클래스는 생성되어 있으나 아직 init, configure 메소드 실행이 이루어지지 않았다.

`http.build()` → `doBuild()` 메소드를 보면

```java
public abstract class AbstractConfiguredSecurityBuilder<O, B extends SecurityBuilder<O>>
		extends AbstractSecurityBuilder<O> {
	...
    @Override
    protected final O doBuild() throws Exception {
        synchronized (this.configurers) {
            this.buildState = BuildState.INITIALIZING;
            beforeInit();
            init();
            this.buildState = BuildState.CONFIGURING;
            beforeConfigure();
            configure();
            this.buildState = BuildState.BUILDING;
            O result = performBuild();
            this.buildState = BuildState.BUILT;
            return result;
        }
    }
```

`init(), configure()` 메소드가 호출되는 것을 볼 수 있다.

`init()` 메소드를 보면

![image](/images/lecture/spring-security-s2-5.png)

전달 받은 13개의 Configurer를 확인할 수 있다.

각 configurer의 init을 호출한다. `configurer.init((B) this);`

SessionManagementConfigurer의 init() 메소드를 보면

```java
public final class SessionManagementConfigurer<H extends HttpSecurityBuilder<H>>
		extends AbstractHttpConfigurer<SessionManagementConfigurer<H>, H> {
    ...
	@Override
	public void init(H http) {
		SecurityContextRepository securityContextRepository = http.getSharedObject(SecurityContextRepository.class);
		boolean stateless = isStateless();
		if (securityContextRepository == null) {
			if (stateless) {
				http.setSharedObject(SecurityContextRepository.class, new RequestAttributeSecurityContextRepository());
				this.sessionManagementSecurityContextRepository = new NullSecurityContextRepository();
			}
			else {
				HttpSessionSecurityContextRepository httpSecurityRepository = new HttpSessionSecurityContextRepository();
				httpSecurityRepository.setDisableUrlRewriting(!this.enableSessionUrlRewriting);
				httpSecurityRepository.setAllowSessionCreation(isAllowSessionCreation());
				AuthenticationTrustResolver trustResolver = http.getSharedObject(AuthenticationTrustResolver.class);
				if (trustResolver != null) {
					httpSecurityRepository.setTrustResolver(trustResolver);
				}
				this.sessionManagementSecurityContextRepository = httpSecurityRepository;
				DelegatingSecurityContextRepository defaultRepository = new DelegatingSecurityContextRepository(
						httpSecurityRepository, new RequestAttributeSecurityContextRepository());
				http.setSharedObject(SecurityContextRepository.class, defaultRepository);
			}
		}
		else {
			this.sessionManagementSecurityContextRepository = securityContextRepository;
		}
		RequestCache requestCache = http.getSharedObject(RequestCache.class);
		if (requestCache == null) {
			if (stateless) {
				http.setSharedObject(RequestCache.class, new NullRequestCache());
			}
		}
		http.setSharedObject(SessionAuthenticationStrategy.class, getSessionAuthenticationStrategy(http));
		http.setSharedObject(InvalidSessionStrategy.class, getInvalidSessionStrategy());
	}
```

`http.setSharedObject()`를 써서 객체를 공유하는 작업을 한다.

`configure()` 메소드를 보면

```java

private void configure() throws Exception {
    Collection<SecurityConfigurer<O, B>> configurers = getConfigurers();
    for (SecurityConfigurer<O, B> configurer : configurers) {
        configurer.configure((B) this);
    }
}
```

마찬가지로 각 configurer의 configure()를 호출한다.

호출되는 CsrfConfigurer의 configure() 메소드를 보면

```java
public final class CsrfConfigurer<H extends HttpSecurityBuilder<H>>	
    extends AbstractHttpConfigurer<CsrfConfigurer<H>, H> {
    ...
	@Override
	public void configure(H http) {
		CsrfFilter filter = new CsrfFilter(this.csrfTokenRepository);
		RequestMatcher requireCsrfProtectionMatcher = getRequireCsrfProtectionMatcher();
		if (requireCsrfProtectionMatcher != null) {
			filter.setRequireCsrfProtectionMatcher(requireCsrfProtectionMatcher);
		}
		AccessDeniedHandler accessDeniedHandler = createAccessDeniedHandler(http);
		ObservationRegistry registry = getObservationRegistry();
		if (!registry.isNoop()) {
			ObservationMarkingAccessDeniedHandler observable = new ObservationMarkingAccessDeniedHandler(registry);
			accessDeniedHandler = new CompositeAccessDeniedHandler(observable, accessDeniedHandler);
		}
		if (accessDeniedHandler != null) {
			filter.setAccessDeniedHandler(accessDeniedHandler);
		}
		LogoutConfigurer<H> logoutConfigurer = http.getConfigurer(LogoutConfigurer.class);
		if (logoutConfigurer != null) {
			logoutConfigurer.addLogoutHandler(new CsrfLogoutHandler(this.csrfTokenRepository));
		}
		SessionManagementConfigurer<H> sessionConfigurer = http.getConfigurer(SessionManagementConfigurer.class);
		if (sessionConfigurer != null) {
			sessionConfigurer.addSessionAuthenticationStrategy(getSessionAuthenticationStrategy());
		}
		if (this.requestHandler != null) {
			filter.setRequestHandler(this.requestHandler);
		}
		filter = postProcess(filter);
		http.addFilter(filter);
	}

```

필터를 만들고 여러가지 보안 기능을 설정하고 httpSecurity에 필터를 추가하는 것을 확인할 수 있다.

`http.build()` 끝나면 → SecurityFilterChain이 생성된다.

## HttpSecurity, WebSecurity
### HttpSecurity
- `HttpSecurityConfiguration`에서 HttpSecurity를 생성하고 초기화를 진행한다.
	- Configurer를 만들고 HttpSecurity가 생성되면 Configurer의 init, configure 메소드로 필터를 생성하고 등록한다.
- 보안에 필요한 각 설정 클래스와 필터들을 생성하고 최종적으로 SecurityFilterChain 빈 생성
	(SecurityFilterChain이 인증, 인가 처리할 필터들을 가지고 있다.)

![image](/images/lecture/spring-security-s2-6.png)

### SecurityFilterChain
![image](/images/lecture/spring-security-s2-7.png)

***boolean matches(HttpServletRequest request)***

- 요청이 현재 SecurityFilterChain에 의해 처리되어야 하는지 결정한다.
	- true 반환 → 현재 요청이 이 필터 체인에 의해 처리되어야 함
	- false 반환 → 다른 필터 체인이나 처리 로직에 의해 처리되어야 함
- 이를 통해 특정 요청에 대해 적절한 보안 필터링 로직이 적용될 수 있도록 한다.

***List\<Filter> getFilters()***

- 현재 SecurityFilterChain에 포함된 Filter 리스트를 반환한다.
- 어떤 필터가 현재 필터 체인에 포함되어 있는지 확인할 수 있으며, 각 필터는 요청 처리 과정에서 특정 작업(인증, 권한 부여, 로깅 등)을 수행한다.

![image](/images/lecture/spring-security-s2-8.png)

RequestMatcher를 통해 필터가 동작해야 하는지 확인한다.
- `/users` (특정 URI) 매치되면 → 해당 SecurityFilterChain 타고, 매치 안 되면 해당 SecurityFilterChain을 건너띈다.

### WebSecurity
- `WebSecurityConfiguration`에서 WebSecurity를 생성하고 초기화를 진행한다.
- HttpSecurity에서 생성한 SecurityFilterChain을 SecurityBuilder에 저장한다.
	- 여러 개의 SecurityFilterChain을 가질 수 있다.
- WebSecurity가 build()를 실행하면 SecurityBuilder에서 SecurityFilterChain을 꺼내어 FilterChainProxy 생성자에게 전달한다. → 최종적으로 FilterChainProxy 생성
- WebSecurity가 HttpSecurity의 상위 개념
	- HttpSecurity가 만든 빈을 WebSecurity가 만든 빈에 저장하므로
- 최종적으로 만들어진 FilterChainProxy가 모든 요청에 대해 1차적으로 필터들을 실행시키는 객체가 된다.

![image](/images/lecture/spring-security-s2-9.png)

이러한 흐름은 FilterChainProxy을 만들어서 SecurityFilterChain을 저장하기 위한 과정이었다.

FilterChainProxy가 모든 보안 설정들어있는 필터 목록들을 가지고 있다 볼 수 있다.

**[생성 과정]**
```java
@Configuration(proxyBeanMethods = false)
public class WebSecurityConfiguration implements ImportAware, BeanClassLoaderAware {
	...
	@Autowired(required = false)
	public void setFilterChainProxySecurityConfigurer(ObjectPostProcessor<Object> objectPostProcessor,
			ConfigurableListableBeanFactory beanFactory) throws Exception {
		this.webSecurity = objectPostProcessor.postProcess(new WebSecurity(objectPostProcessor));
		if (this.debugEnabled != null) {
			this.webSecurity.debug(this.debugEnabled);
		}
		List<SecurityConfigurer<Filter, WebSecurity>> webSecurityConfigurers = new AutowiredWebSecurityConfigurersIgnoreParents(
				beanFactory)
			.getWebSecurityConfigurers();
		webSecurityConfigurers.sort(AnnotationAwareOrderComparator.INSTANCE);
		Integer previousOrder = null;
		Object previousConfig = null;
		for (SecurityConfigurer<Filter, WebSecurity> config : webSecurityConfigurers) {
			Integer order = AnnotationAwareOrderComparator.lookupOrder(config);
			if (previousOrder != null && previousOrder.equals(order)) {
				throw new IllegalStateException("@Order on WebSecurityConfigurers must be unique. Order of " + order
						+ " was already used on " + previousConfig + ", so it cannot be used on " + config + " too.");
			}
			previousOrder = order;
			previousConfig = config;
		}
		for (SecurityConfigurer<Filter, WebSecurity> webSecurityConfigurer : webSecurityConfigurers) {
			this.webSecurity.apply(webSecurityConfigurer);
		}
		this.webSecurityConfigurers = webSecurityConfigurers;
	}
```

HttpSecurity.build() 과정에서 다음 빌더의 `doBuild()` 메소드가 호출된다.
```java
public abstract class AbstractConfiguredSecurityBuilder<O, B extends SecurityBuilder<O>>
		extends AbstractSecurityBuilder<O> {
	...
    @Override
    protected final O doBuild() throws Exception {
        synchronized (this.configurers) {
            this.buildState = BuildState.INITIALIZING;
            beforeInit();
            init();
            this.buildState = BuildState.CONFIGURING;
            beforeConfigure();
            configure();
            this.buildState = BuildState.BUILDING;
            O result = performBuild();
            this.buildState = BuildState.BUILT;
            return result;
        }
    }
```
이 때 `performBuild()` 코드를 보면

```java
public final class HttpSecurity extends AbstractConfiguredSecurityBuilder<DefaultSecurityFilterChain, HttpSecurity>
	implements SecurityBuilder<DefaultSecurityFilterChain>, HttpSecurityBuilder<HttpSecurity> {
	@Override
	protected DefaultSecurityFilterChain performBuild() {
		ExpressionUrlAuthorizationConfigurer<?> expressionConfigurer = getConfigurer(
				ExpressionUrlAuthorizationConfigurer.class);
		AuthorizeHttpRequestsConfigurer<?> httpConfigurer = getConfigurer(AuthorizeHttpRequestsConfigurer.class);
		boolean oneConfigurerPresent = expressionConfigurer == null ^ httpConfigurer == null;
		Assert.state((expressionConfigurer == null && httpConfigurer == null) || oneConfigurerPresent,
				"authorizeHttpRequests cannot be used in conjunction with authorizeRequests. Please select just one.");
		this.filters.sort(OrderComparator.INSTANCE);
		List<Filter> sortedFilters = new ArrayList<>(this.filters.size());
		for (Filter filter : this.filters) {
			sortedFilters.add(((OrderedFilter) filter).filter);
		}
		return new DefaultSecurityFilterChain(this.requestMatcher, sortedFilters);
	}
...
```

필터를 리스트에 추가하고

`return new DefaultSecurityFilterChain(this.requestMatcher, sortedFilters);`
- DefaultSecurityFilterChain을 생성한다. 

WebSecurity가 받은 FilterChain을 어떻게 사용할까?

![image](/images/lecture/spring-security-s2-10.png)

WebSecurityConfiguration의 위 메소드에서 하나의 필터 체인이 정상 등록되어 있음을 확인할 수 있다.

```java
@Bean(name = AbstractSecurityWebApplicationInitializer.DEFAULT_FILTER_NAME)
public Filter springSecurityFilterChain() throws Exception {
    boolean hasFilterChain = !this.securityFilterChains.isEmpty();
    if (!hasFilterChain) {
        this.webSecurity.addSecurityFilterChainBuilder(() -> {
            this.httpSecurity.authorizeHttpRequests((authorize) -> authorize.anyRequest().authenticated());
            this.httpSecurity.formLogin(Customizer.withDefaults());
            this.httpSecurity.httpBasic(Customizer.withDefaults());
            return this.httpSecurity.build();
        });
    }
    for (SecurityFilterChain securityFilterChain : this.securityFilterChains) {
        this.webSecurity.addSecurityFilterChainBuilder(() -> securityFilterChain);
    }
    for (WebSecurityCustomizer customizer : this.webSecurityCustomizers) {
        customizer.customize(this.webSecurity);
    }
    return this.webSecurity.build();
}
```

그리고 WebSecurity의 securityFilterChainBuilders 속성에 SecurityFilterChain을 Add한다. (13L)

```java
public WebSecurity addSecurityFilterChainBuilder(
        SecurityBuilder<? extends SecurityFilterChain> securityFilterChainBuilder) {
    this.securityFilterChainBuilders.add(securityFilterChainBuilder);
    return this;
}
```

이후 `return this.webSecurity.build();` → `WebSecurity.performBuild()`

```java
@Override
protected Filter performBuild() throws Exception {
    ...
    for (SecurityBuilder<? extends SecurityFilterChain> securityFilterChainBuilder : this.securityFilterChainBuilders) {
        SecurityFilterChain securityFilterChain = securityFilterChainBuilder.build();
        securityFilterChains.add(securityFilterChain);
        requestMatcherPrivilegeEvaluatorsEntries
            .add(getRequestMatcherPrivilegeEvaluatorsEntry(securityFilterChain));
    }
    ...
    FilterChainProxy filterChainProxy = new FilterChainProxy(securityFilterChains);
    ...
```
`securityFilterChains.add(securityFilterChain);`

- 앞에서 저장한 securityFilterChainBuilders에서 SecurityFilterChain을 빼와서 `List<SecurityFilterChain> securityFilterChains`에 더한다.

`FilterChainProxy filterChainProxy = new FilterChainProxy(securityFilterChains);`
- 그리고 securityFilterChains 전달하여 FilterChainProxy을 생성하고 반환하여 빌드가 완료된다.


## DelegatingFilterProxy, FilterChainProxy
### DelegatingFilterProxy
스프링 시큐리티는 모든 작업을 필터 기반으로 수행한다. 그러나 서블릿 필터는 스프링의 기능(DI, AOP 등) 사용할 수 없다.

이 프록시를 통해 스프링에서 필터 타입의 클래스를 빈으로 생성하여 필터에 DI, AOP 등 스프링의 기능을 사용하기 위해 서블릿과 스프링 애플리케이션 컨텍스트 사이를 연결하는 다리 역할을 하도록 이 클래스를 설계했다.

- 서블릿 컨테이너와 애플리케이션 컨텍스트 간의 연결고리 역할을 하는 <u>스프링에서 사용되는 특별한 필터</u>
- 서블릿 필터의 기능을 수행하는 동시에 스프링 의존성 주입, 빈 관리 기능과 연동되도록 설계되었다.
- `springSecurityFilterChain` 이름으로 생성된 빈을 애플리케이션 컨텍스트에서 찾아 요청을 위임한다.

![image](/images/lecture/spring-security-s2-11.png)

### FilterChainProxy
- `springSecurityFilterChain`의 이름으로 생성되는 필터 빈으로서 DelegatingFilterProxy 로부터 요청을 위임 받고 보안 처리 역할을 한다.
- 하나 이상의 SecurityFilterChain 객체들을 가지고 있으며 요청 URL 정보를 기준으로 적절한 SecurityFilterChain을 선택하여 필터를 호출한다.
- HttpSecurity를 통해 API 추가 시 관련 필터들이 추가된다.
- 사용자의 요청을 필터 순서대로 호출함으로 보안 기능을 동작시키고 필요 시 직접 필터를 생성해서 기존의 필터 전.후에 추가할 수 있다.

**[DelegatingFilterProxy 생성]**

```java
@AutoConfiguration(after = SecurityAutoConfiguration.class)
@ConditionalOnWebApplication(type = Type.SERVLET)
@EnableConfigurationProperties(SecurityProperties.class)
@ConditionalOnClass({ AbstractSecurityWebApplicationInitializer.class, SessionCreationPolicy.class })
public class SecurityFilterAutoConfiguration {

	private static final String DEFAULT_FILTER_NAME = AbstractSecurityWebApplicationInitializer.DEFAULT_FILTER_NAME;

	@Bean
	@ConditionalOnBean(name = DEFAULT_FILTER_NAME)
	public DelegatingFilterProxyRegistrationBean securityFilterChainRegistration(
			SecurityProperties securityProperties) {
		DelegatingFilterProxyRegistrationBean registration = new DelegatingFilterProxyRegistrationBean(
				DEFAULT_FILTER_NAME);
         registration.setOrder(securityProperties.getFilter().getOrder());
		registration.setDispatcherTypes(getDispatcherTypes(securityProperties));
		return registration;
	}
```

```java
public abstract class AbstractSecurityWebApplicationInitializer implements WebApplicationInitializer {
    private static final String SERVLET_CONTEXT_PREFIX = "org.springframework.web.servlet.FrameworkServlet.CONTEXT.";
    public static final String DEFAULT_FILTER_NAME = "springSecurityFilterChain";
```

빈을 만들 때 'springSecurityFilterChain' 이름을 전달하는 것을 확인할 수 있다.

```java
public class DelegatingFilterProxyRegistrationBean extends AbstractFilterRegistrationBean<DelegatingFilterProxy>
		implements ApplicationContextAware {
    ...
    @Override
	public DelegatingFilterProxy getFilter() {
		return new DelegatingFilterProxy(this.targetBeanName, getWebApplicationContext()) {

			@Override
			protected void initFilterBean() throws ServletException {
				// Don't initialize filter bean on init()
			}

		};
	}
    ...
```

`this.targetBeanName = "springSecurityFilterChain"`으로 애플리케이션 컨텍스트에서 빈을 찾겠다.

```java
public abstract class AbstractFilterRegistrationBean<T extends Filter> extends DynamicRegistrationBean<Dynamic> {
	...
    @Override
	protected Dynamic addRegistration(String description, ServletContext servletContext) {
		Filter filter = getFilter();
		return servletContext.addFilter(getOrDeduceName(filter), filter);
	}
	...
```

DelegatingFilterProxy 필터를 서블릿 컨테이너에 저장한다.

**[DelegatingFilterProxy 동작]**

```java
public class DelegatingFilterProxy extends GenericFilterBean {
    ...
	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		// Lazily initialize the delegate if necessary.
		Filter delegateToUse = this.delegate;
		if (delegateToUse == null) {
			this.delegateLock.lock();
			try {
				delegateToUse = this.delegate;
				if (delegateToUse == null) {
                      // 애플리케이션 컨텍스트 찾고 
					WebApplicationContext wac = findWebApplicationContext();
					if (wac == null) {
						throw new IllegalStateException("No WebApplicationContext found: " +
								"no ContextLoaderListener or DispatcherServlet registered?");
					}
                      // 애플리케이션 컨텍스트에서 FilterChainProxy 받아와
					delegateToUse = initDelegate(wac);
				}
				this.delegate = delegateToUse;
			}
			finally {
				this.delegateLock.unlock();
			}
		}

		// Let the delegate perform the actual doFilter operation.
		invokeDelegate(delegateToUse, request, response, filterChain);
	}
```

애플리케이션 컨텍스트 찾고 → `initDelegate()` 호출

```java
public class DelegatingFilterProxy extends GenericFilterBean {
    ...
    protected Filter initDelegate(WebApplicationContext wac) throws ServletException {
        String targetBeanName = getTargetBeanName();
        Assert.state(targetBeanName != null, "No target bean name set");
        Filter delegate = wac.getBean(targetBeanName, Filter.class);
        if (isTargetFilterLifecycle()) {
            delegate.init(getFilterConfig());
        }
        return delegate;
    }
```

targetBeanName으로 <u>FilterChainProxy 빈 찾아온다</u>. 이후 `invokeDelegate()` 호출 → 실제 Security Filter 탄다.


## 사용자 정의 보안 설정
- 한 개 이상의 SecurityFilterChain 타입의 빈을 정의한 후 인증 / 인가 API를 설정한다.

![image](/images/lecture/spring-security-s2-12.png)

**[SecurityConfig 클래스 생성]**

```java
// Spring Security 활성화. 웹 보안 설정.
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http.authorizeHttpRequests(auth-> auth.anyRequest().authenticated())
                .formLogin(Customizer.withDefaults());
        return http.build();
    }
}
```
- 모든 코드는 람다 형식으로 작성해야 한다. (시큐리티 7 버전부터 람다 형식만 지원 예정)
- SecurityFilterChain을 빈으로 정의하면 자동설정에 의한 SecurityFilterChain 빈은 생성되지 않는다.

```java
class SpringBootWebSecurityConfiguration {
	...
	@ConditionalOnDefaultWebSecurity
	static class SecurityFilterChainConfiguration {
		@Bean
		@Order(SecurityProperties.BASIC_AUTH_ORDER)
		SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
```

자동 설정에 의한 필터 체인 빈 선언부의 `@ConditionalOnDefaultWebSecurity`를 추적하면

```java
class DefaultWebSecurityCondition extends AllNestedConditions {
	...
	@ConditionalOnMissingBean({ SecurityFilterChain.class })
	static class Beans {
```

SecurityFilterChain 빈이 없는 경우에만 디폴트 시큐리티 필터 체인이 생성되는 것을 확인할 수 있다.

**[사용자 설정 추가]**
(1) application.yml

```
spring:
  security:
    user:
      name: user
      password: 1234
      roles: USER
```

(2) 자바 설정 클래스에 빈 생성
```java
@Bean
public InMemoryUserDetailsManager inMemoryUserDetailsManager() {
    UserDetails user = User.withUsername("user")
            .password("{noop}1234")
            .authorities("ROLE_USER")
            .build();
    UserDetails user2 = User.withUsername("user2")
            .password("{noop}1234")
            .authorities("ROLE_USER")
            .build();
    UserDetails user3 = User.withUsername("user3")
            .password("{noop}1234")
            .authorities("ROLE_USER")
            .build();
    return new InMemoryUserDetailsManager(user, user2, user3);
}
```

```java
@Bean
public UserDetailsService userDetailsService() {
    UserDetails user = User.withUsername("user")
            .password("{noop}1234")
            .authorities("USER")
            .build();
    UserDetails user2 = User.withUsername("user2")
            .password("{noop}1234")
            .authorities("USER")
            .build();
    UserDetails user3 = User.withUsername("user3")
            .password("{noop}1234")
            .authorities("USER")
            .build();
    return new InMemoryUserDetailsManager(user, user2, user3);
}
```

- `.password("{noop}1234")` : {noop)는 비밀번호 인코딩을 하지 않음을 의미
- yml 설정과 Config 빈 설정이 중복되면 Config 빈 설정이 우선순위가 높다.
