# 인증 아키텍처
## 인증 / 인가 흐름
![image](/images/lecture/spring-security-s4-1.png)

1. DelegatingFilterProxy는 요청을 받아 스프링 컨테이너로 넘겨준다.
	- 스프링에서 필터로 사용할 수 있는 다리 역할
	- FilterChainProxy에 요청을 넘겨준다. FilterChainProxy는 요청을 인증 필터에 넘겨서 인증 처리를 수행한다.
2. AuthenticationFilter는 요청을 통해 사용자 정보를 검증하고  Authentication 객체를 만들어서 AuthenticationManager에게 넘긴다.
3. AuthenticationManager는 인증 객체를 AuthenticationProvider에게 위임한다. 사용자의 아이디, 패스워드 확인을 AuthenticationProvider에게 위임한다.
4. AuthenticationProvider에게는 사용자 정보가 맞는지 디비나 메모리를 통해 로그인한 사용자의 인증 정보를 확인한다.
	- UserDetailsService 통해서 UserDetails 타입 사용자 정보를 읽어와서 AuthenticationProvider에게 반환한다.
5. AuthenticationProvider는 UserDetails가 null이면 실패 처리한다.
	- UserDetails 정보를 읽어왔다면 PasswordEncoder를 통해 사용자의 패스워드를 검증한다.
	- 패스워드까지 일치한다면 프로바이더는 Authentication 객체를 만들어 AuthenticationManager에게 반환한다.
6. AuthenticationManager는 인증 객체를 AuthenticationFilter에게 반환하고 최종적으로 Authentication 객체를 SecurityContextHolder를 통해 SecurityContext에 저장한다.


## Authentication
- 자원에 접근하는 사용자의 신원을 확인하는 방법을 의미한다.
- `Authentication`은 사용자의 인증 정보를 저장하는 토큰 개념의 객체로 활용되며 인증 이후 `SecurityContext`에 저장되어 전역 참조 가능하다.

### 구조
`Principal`은 Java API. 스프링의 기술이 아니다.<br/>
`Authentication`은 스프링 시큐리티의 기술. `Principal`을 상속받은 클래스.

![image](/images/lecture/spring-security-s4-2.png)


- `getPrincipal()`
	- 인증 주체를 의미. 인증 요청의 경우 사용자 이름을, 인증 후에는 UserDetails 타입의 객체
- `getCredentials()`
	- 인증 주체가 올바른 것을 증명하는 자격 증명. 보통 비밀번호를 의미
	- 보안 상 `null`로 유지하는 경우가 많다.
- `getAuthorities()`
	- 인증 주체에서 부여된 권한
- `getDetails()`
	- 인증 요청에 대한 추가 세부 사항을 저장. IP 주소, 인증서 일련 번호 등
- `isAuthenticated()`
	- 인증 상태를 반환
- `setAuthenticated(boolean)`
	- 인증 상태를 설정

**[흐름도]**
![image](/images/lecture/spring-security-s4-3.png)

**[동작 과정]**
```java
public class UsernamePasswordAuthenticationFilter extends AbstractAuthenticationProcessingFilter {
	...
	@Override
	public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
			throws AuthenticationException {
		...
		// Authentication 객체 생성
		UsernamePasswordAuthenticationToken authRequest = UsernamePasswordAuthenticationToken.unauthenticated(username,
				password);
		// Allow subclasses to set the "details" property
		setDetails(request, authRequest);
		// AuthenticationManager에 위임
		return this.getAuthenticationManager().authenticate(authRequest);
	}
```
필터는 Authentication 객체(authRequest) 를 만들고

AuthenticationManager → AuthenticationManager(ProviderManager)에 위임

```java
public class ProviderManager implements AuthenticationManager, MessageSourceAware, InitializingBean {
	...
	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		Class<? extends Authentication> toTest = authentication.getClass();
		...
		for (AuthenticationProvider provider : getProviders()) {
			...
			try {
				// DaoAuthenticationProvider에 위임 (AbstractUserDetailsAuthenticationProvider)
				result = provider.authenticate(authentication);
				if (result != null) {
					copyDetails(authentication, result);
					break;
				}

```

ProviderManager → AbstractUserDetailsAuthenticationProvider(AuthenticationProvider)에 위임

```java
public abstract class AbstractUserDetailsAuthenticationProvider
		implements AuthenticationProvider, InitializingBean, MessageSourceAware {
	...
	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		Assert.isInstanceOf(UsernamePasswordAuthenticationToken.class, authentication,
				() -> this.messages.getMessage("AbstractUserDetailsAuthenticationProvider.onlySupports",
						"Only UsernamePasswordAuthenticationToken is supported"));
		String username = determineUsername(authentication);
		boolean cacheWasUsed = true;
		UserDetails user = this.userCache.getUserFromCache(username);
		if (user == null) {
			cacheWasUsed = false;
			try {
				// DaoAuthenticationProvider 구현 메소드 호출
				user = retrieveUser(username, (UsernamePasswordAuthenticationToken) authentication);
```

AbstractUserDetailsAuthenticationProvider → DaoAuthenticationProvider에 위임

```java
public class DaoAuthenticationProvider extends AbstractUserDetailsAuthenticationProvider {
	...
	@Override
	protected final UserDetails retrieveUser(String username, UsernamePasswordAuthenticationToken authentication)
			throws AuthenticationException {
		prepareTimingAttackProtection();
		try {
			// UserDetailsService 호출하여 사용자 정보 읽어온다.
			UserDetails loadedUser = this.getUserDetailsService().loadUserByUsername(username);
			if (loadedUser == null) {
				throw new InternalAuthenticationServiceException(
						"UserDetailsService returned null, which is an interface contract violation");
			}
			return loadedUser;
```

사용자 정보 가져오는 절차 완료되었다.

이제 패스워드를 검증한다.

AbstractUserDetailsAuthenticationProvider → DaoAuthenticationProvider.additionalAuthenticationChecks()
```java
public abstract class AbstractUserDetailsAuthenticationProvider
		implements AuthenticationProvider, InitializingBean, MessageSourceAware {
	...
	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		...
		UserDetails user = this.userCache.getUserFromCache(username);
		if (user == null) {
			cacheWasUsed = false;
			try {
				// DaoAuthenticationProvider 구현 메소드 호출
				user = retrieveUser(username, (UsernamePasswordAuthenticationToken) authentication);
				// UserDetails 받은 이후
		...
		try {
			this.preAuthenticationChecks.check(user);
			// 패스워드 검증 (하기는 추상 메소드로 DaoAuthenticationProvider의 메소드가 호출)
			additionalAuthenticationChecks(user, (UsernamePasswordAuthenticationToken) authentication);
		}
```

```java
public class DaoAuthenticationProvider extends AbstractUserDetailsAuthenticationProvider {
	...
	private PasswordEncoder passwordEncoder;
	...
	@Override
	@SuppressWarnings("deprecation")
	protected void additionalAuthenticationChecks(UserDetails userDetails,
			UsernamePasswordAuthenticationToken authentication) throws AuthenticationException {
		...
		// 패스워드 확인
		String presentedPassword = authentication.getCredentials().toString();
		if (!this.passwordEncoder.matches(presentedPassword, userDetails.getPassword())) {
			this.logger.debug("Failed to authenticate since password does not match stored value");
			throw new BadCredentialsException(this.messages
				.getMessage("AbstractUserDetailsAuthenticationProvider.badCredentials", "Bad credentials"));
		}
	}
```
PasswordEncoder를 이용하여 패스워드를 검증한다.

패스워드 일치하면 인증에 성공하고, 이후 <u>AuthenticationProvider는 인증을 성공한 최종 사용자 정보를 담은 Authentication 객체를 생성</u>한다.

```java
public abstract class AbstractUserDetailsAuthenticationProvider
		implements AuthenticationProvider, InitializingBean, MessageSourceAware {
	...
	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		...
		return createSuccessAuthentication(principalToReturn, authentication, user);
	}
	
	protected Authentication createSuccessAuthentication(Object principal, Authentication authentication,
			UserDetails user) {
		...
		// 유저 정보, 권한 정보, 패스워드(는 null로 바뀜)를 담은 인증 객체 생성해서 리턴한다.
		UsernamePasswordAuthenticationToken result = UsernamePasswordAuthenticationToken.authenticated(principal,
				authentication.getCredentials(), this.authoritiesMapper.mapAuthorities(user.getAuthorities()));
		result.setDetails(authentication.getDetails());
		this.logger.debug("Authenticated user");
		return result;
	}
```

AuthenticationManager(ProviderManager)는 필터에게 Authentication 객체를 반환한다.

```java
public class ProviderManager implements AuthenticationManager, MessageSourceAware, InitializingBean {
	...
	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		Class<? extends Authentication> toTest = authentication.getClass();
		...
		Authentication result = null;
		...
		for (AuthenticationProvider provider : getProviders()) {
			...
			try {
				// DaoAuthenticationProvider에 위임 (AbstractUserDetailsAuthenticationProvider)
				result = provider.authenticate(authentication);
				if (result != null) {
					copyDetails(authentication, result);
					break;
				}
		...
		// 인증 객체 반환
		return result;
	}
```

필터는 인증 객체를 받은 이후 SecurityContext에 인증 객체를 저장한다.

```java
public abstract class AbstractAuthenticationProcessingFilter extends GenericFilterBean
    implements ApplicationEventPublisherAware, MessageSourceAware {
    ...
    private void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
		...
		try {
			Authentication authenticationResult = attemptAuthentication(request, response);
			// null 이면 인증 안 됨 - 바로 리턴
			if (authenticationResult == null) {
				// return immediately as subclass has indicated that it hasn't completed
				return;
			}
			...
			// 인증 성공 시
			successfulAuthentication(request, response, chain, authenticationResult);
	...
	protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
			Authentication authResult) throws IOException, ServletException {
		SecurityContext context = this.securityContextHolderStrategy.createEmptyContext();
		context.setAuthentication(authResult);
		// 시큐리티 컨텍스트에 저장
		this.securityContextHolderStrategy.setContext(context);
		// 세션에 저장
		this.securityContextRepository.saveContext(context, request, response);
		...
	}
```

::: tip
AuthenticationFilter는 인증 시도 초기에 ID/PW 담은 인증 객체를 생성하고 인증 처리를 맡긴다.
AuthenticationProvider는 최종 인증 성공한 후 다시 인증 객체를 생성하여 필터에 전달하며, 필터는 SecurityContext에 인증 객체를 저장한다.
:::

## 인증 컨텍스트
### SecurityContext
- 현재 인증된 사용자의 Authentication 객체를 저장한다.
	- 현재 사용자의 인증 상태나 권한을 확인하는데 사용된다.
- ThreadLocal 저장소에 저장된다.
- 어플리케이션의 어디서든지 접근 가능하다.

::: warning ThreadLocal
각 스레드마다 가지는 독립된 고유 저장소<br/>
SecurityContextHolder에 의해 접근되며 ThreadLocal 저장소를 사용해 각 스레드가 자신만의 보안 컨텍스트를 유지한다.<br/>
클라이언트가 서버에 요청하면 서버는 클라이언트마다 스레드를 생성한다. 스레드마다 스레드 로컬 저장소가 부여된다. 이 스레드 로컬에 시큐리티 컨텍스트가 저장된다. (즉, 스레드마다 시큐리티 컨텍스트를 가진다.)
:::

### SecurityContextHolder
- Authentication 객체를 담은 SecurityContext 객체를 저장한다.
	- 내부적으로 ThreadLocal 가지고 있어서 그 안에 SecurityContext를 저장한다.
	- `SecurityContxtHolder > ThreadLocal > SecurityContext > Authentication`
- 다양한 저장 전략을 지원하기 위해 `SecurityContextHolderStrategy` 인터페이스 사용
- 전략 모드 직접 지정은 `SecurityContextHolder.setStrategyName(String)`

![image](/images/lecture/spring-security-s4-4.png)

```java
void clearContext(); // 현재 컨텍스트를 삭제한다
SecurityContext getContext(); // 현재 컨텍스트를 얻는다
Supplier<SecurityContext> getDeferredContext() // 현재 컨텍스트를 반환하는 Supplier 를 얻는다
void setContext(SecurityContext context); // 현재 컨텍스트를 저장한다
void setDeferredContext(Supplier<SecurityContext> deferredContext) // 현재 컨텍스트를 반환하는 Supplier 를 저장한다
SecurityContext createEmptyContext(); // 새롭고 비어 있는 컨텍스트를 생성한다
```

**[저장 모드]**
- MODE_THREADLOCAL
	- 기본 모드로 각 스레드가 독립적인 보안 컨텍스트를 가진다. 대부분의 서버 환경에 적합
- MODE_INHERITABLETHREADLOCAL
	- 부모 스레드로부터 자식 스레드 보안 컨텍스트가 상속되며, 작업을 스레드 간 분산 실행하는 경우에 유용
- MODE_GLOBAL
	- 전역적으로 단일 보안 컨텍스트를 사용하며 서버 환경에서는 부적합하며 주로 간단한 애플리케이션에 적합

#### 참조 및 삭제
```java
SecurityContexHolder.getContextHolderStrategy().getContext();
SecurityContexHolder.getContextHolderStrategy().clearContext();
```

### 구조
![image](/images/lecture/spring-security-s4-5.png)

Request에 대해 각각의 스레드가 할당되며, 해당 스레드의 스레드 로컬에는 SecurityContext가 존재한다. 보통 스레드 풀을 만들고 요청을 각 스레드에 할당시켜서 그 요청을 처리한다.

SecurityContextHolder는 각 요청의 ThreadLocal 1 ~ 3에 시큐리티 컨텍스트를 저장한다.

스레드마다 독립적으로 자기 자신만의 ThreadLocal(시큐리티 컨텍스트)를 가지며 시큐리티 컨텍스트는 스레드 간에 공유되지 않는다.

- 스레드마다 할당 되는 전용 저장소에 SecurityContext를 저장하기 때문에 동시성의 문제가 없다.

- 스레드 풀에서 운용되는 스레드는 새로운 요청이더라도 기존의 ThreadLocal이 재사용될 수 있기 때문에 클라이언트로 응답 직전에 <u>항상 SecurityContext를 삭제</u>한다

**[ThreadLocal 사용하는 이유]**

1번 요청은 1번 요청을 담당하는 스레드의 인증 객체를 가져야지, 2번 요청을 담당하는 스레드의 인증 객체를 참조하면 안 된다. 스레드 로컬은 각 스레드마다 독립적으로 가지고 있어서 스레드 간 공유되지 않기 때문에 스레드 로컬을 사용한다.

#### SecurityContextHolderStrategy 사용하기
**[기존 방식]**

```java
SecurityContext context = SecurityContextHolder.createEmptyContext();
context.setAuthentication(authentication);
SecurityContextHolder.setContext(context);
```
위 코드는 SecurityContextHolder를 통해 SecurityContext에 정적으로 접근할 때
여러 애플리케이션 컨텍스트가 동시에 SecurityContextHolderStrategy를 지정한다면 경쟁 조건을 만들 수 있다.

SecurityContextHolderStrategy를 공유하기 때문에 각각의 어플리케이션 컨텍스트가 하나의 SecurityContextHolderStrategy에 동시에 접근할 수 있기 때문이다.

**[변경된 방식]**

```java
SecurityContextHolderStrategy securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy();
SecurityContext context = securityContextHolderStrategy.createEmptyContext();
context.setAuthentication(authentication);
securityContextHolderStrategy.setContext(context);
```
애플리케이션이 SecurityContext를 정적으로 접근하는 대신 SecurityContextHolderStrategy를 자동 주입되도록 한다.

각 애플리케이션 컨텍스트는 자신에게 가장 적합한 보안 전략을 사용할 수 있다.

## 인증 관리자
![image](/images/lecture/spring-security-s4-6.png)

### AuthenticationManager
- 인증 필터로부터 Authentication 객체를 전달 받아 인증을 시도하며 인증에 성공할 경우 사용자 정보, 권한 등을 포함한 완전히 채워진 Authentication 객체를 반환한다.
- AuthenticationManager는 <u>여러 AuthenticationProvider들을 관리</u>하며 AuthenticationProvider 목록을 순차적으로 순회하며 인증 요청을 처리한다.
	- AuthenticationProvider 목록 중에서 인증 처리에 적합한 프로바이더를 찾아 인증 처리를 위임한다. (실제 인증 처리를 프로바이더에게 위임)
	- 자기 자신이 처리하지 못하면 부모 AuthenticationManager에게 인증 처리를 맡긴다.
- AuthenticationManagerBuilder에 의해 객체가 생성되며 주로 사용하는 구현체로 ProviderManager가 제공된다.

### AuthenticationManagerBuilder
- AuthenticationManager 객체를 생성하며 UserDetailsService 및 AuthenticationProvider를 추가할 수 있다.
- `HttpSecurity.getSharedObject(AuthenticationManagerBuilder.class)`를 통해 객체를 참조할 수 있다.

**[흐름도]**
![image](/images/lecture/spring-security-s4-7.png)

- 인증 필터가 ProviderManager에게 Authentication 객체와 함께 인증 요청을 위임하면 ProviderManager는 해당 인증을 처리할 수 있는 Provider에게 Authentication 객체를 위임한다.
  - e.g. Form 인증 요청이 온다면 ProviderManager는 해당 인증을 처리할 수 있는 적절한 Provider를 선택한다. (Form 인증은 DaoAuthenticationProvider)

- 선택적으로 부모 AuthenticationManager를 구성할 수 있으며 이 부모는 AuthenticationProvider가 인증을 수행할 수 없는 경우 추가적으로 탐색할 수 있다.
  - e.g. OAuth2 인증을 처리할 수 있는 프로바이더가 없는 경우 자신의 부모 ProviderManager가 있는지 확인한다. 부모 프로바이더 매니저가 처리할 수 있는 프로바이더를 보고 OAuth2 인증을 처리 할 수 있는 프로바이더가 있다면 맡길 수 있다.

- AuthenticationProvider 로부터 null 이 아닌 응답 받을 때까지 차례대로 시도하며 응답을 받지 못하면 `ProviderNotFoundException`과 함께 인증 실패한다.

#### 사용 방법
- CustomAuthenticationFilter
```java
public class CustomAuthenticationFilter extends AbstractAuthenticationProcessingFilter {
    private final ObjectMapper objectMapper = new ObjectMapper();
    public CustomAuthenticationFilter(HttpSecurity http) {
        super(new AntPathRequestMatcher("/api/login", "GET"));
        setSecurityContextRepository(getSecurityContextRepository(http));
    }

    private SecurityContextRepository getSecurityContextRepository(HttpSecurity http) {
        SecurityContextRepository securityContextRepository = http.getSharedObject(SecurityContextRepository.class);
        if (securityContextRepository == null) {
            securityContextRepository = new DelegatingSecurityContextRepository(
                    new RequestAttributeSecurityContextRepository(), new HttpSessionSecurityContextRepository());
        }
        return securityContextRepository;
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException, IOException {

        String username = request.getParameter("username");
        String password = request.getParameter("password");

        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(username,password);

        return this.getAuthenticationManager().authenticate(token);
    }
}
```

- CustomAuthenticationProvider
```java
public class CustomAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {

        String loginId = authentication.getName();
        String password = (String) authentication.getCredentials();

        return new UsernamePasswordAuthenticationToken(loginId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.isAssignableFrom(UsernamePasswordAuthenticationToken.class);
    }
}
```

1. `HttpSecurity` 사용

```java
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authenticationManagerBuilder = http.getSharedObject(AuthenticationManagerBuilder.class);
        AuthenticationManager authenticationManager = authenticationManagerBuilder.build();   // 최초 1번만 호출해야 함
//        AuthenticationManager authenticationManager = authenticationManagerBuilder.getObject();  // build 후에는 getObject()로 참조


        http.authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/api/login").permitAll()
                        .anyRequest().authenticated())
                .authenticationManager(authenticationManager)
                .addFilterBefore(customFilter(http, authenticationManager), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    // Bean으로 선언할 수 없다. (AuthenticationManager는 빈이 아님)
    public CustomAuthenticationFilter customFilter(HttpSecurity http, AuthenticationManager authenticationManager) {
        CustomAuthenticationFilter customAuthenticationFilter = new CustomAuthenticationFilter(http);
        customAuthenticationFilter.setAuthenticationManager(authenticationManager);

        return customAuthenticationFilter;
    }
    ...
```

2. 직접 생성
```java
@EnableWebSecurity
@Configuration
public class SecurityConfig2 {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/api/login").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(customFilter(http), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    // Bean으로 선언 가능
    public CustomAuthenticationFilter customFilter(HttpSecurity http) {
        List<AuthenticationProvider> list1 = List.of(new DaoAuthenticationProvider());
        ProviderManager parent = new ProviderManager(list1);
        List<AuthenticationProvider> list2 = List.of(new AnonymousAuthenticationProvider("key"), new CustomAuthenticationProvider());
        ProviderManager providerManager = new ProviderManager(list2, parent);

        CustomAuthenticationFilter customAuthenticationFilter = new CustomAuthenticationFilter(http);
        customAuthenticationFilter.setAuthenticationManager(providerManager);

        return customAuthenticationFilter;
    }
```
![image](/images/lecture/spring-security-s4-8.png)

`http://localhost:8080/api/login?username=user&password=1234`

- ProviderManager 디버깅<br/>
	providers → Annonymous / Custom 프로바이더<br/>
	parent.providers → DaoAuthentication 프로바이더로 셋팅된 것 확인

### AuthenticationProvider
- 사용자의 자격 증명을 확인하고 인증 과정을 관리하는 클래스로 사용자가 시스템에 액세스하기 위해 제공한 정보(예: 아이디와 비밀번호)가 유효한지 검증한다.
- 표준 사용자 이름과 비밀번호를 기반으로 한 인증, 토큰 기반 인증, 지문 인식 등 다양한 유형의 인증 메커니즘을 지원한다.
- 인증 성공 시 인증된 자격 증명, 사용자 정보를 포함한 Authentication 객체를 반환한다.
- 인증 중 문제가 발생한 경우 `AuthenticationException` 예외를 발생시킨다.

```java
public interface AuthenticationProvider {
	Authentication authenticate(Authentication authentication) throws AuthenticationException;
	boolean supports(Class<?> authentication); // 인증 수행하기 적합한지 검사
}
```

**[흐름도]**
![image](/images/lecture/spring-security-s4-9.png)


**[생성 과정]**
```java
@Order(InitializeAuthenticationProviderBeanManagerConfigurer.DEFAULT_ORDER)
class InitializeAuthenticationProviderBeanManagerConfigurer extends GlobalAuthenticationConfigurerAdapter {
	...
	class InitializeAuthenticationProviderManagerConfigurer extends GlobalAuthenticationConfigurerAdapter {

		@Override
		public void configure(AuthenticationManagerBuilder auth) {
			if (auth.isConfigured()) {
				return;
			}
			// Custom 빈 없기 때문에 AuthenticationProvider 
			List<BeanWithName<AuthenticationProvider>> authenticationProviders = getBeansWithName(
					AuthenticationProvider.class);
			if (authenticationProviders.isEmpty()) {
				return;
			}
	...
```

`InitializeAuthenticationProviderBeanManagerConfigurer`에서 리턴 후 `InitializeUserDetailsBeanManagerConfigurer` 호출

```java
@Order(InitializeUserDetailsBeanManagerConfigurer.DEFAULT_ORDER)
class InitializeUserDetailsBeanManagerConfigurer extends GlobalAuthenticationConfigurerAdapter {
	...
	class InitializeUserDetailsManagerConfigurer extends GlobalAuthenticationConfigurerAdapter {

		private final Log logger = LogFactory.getLog(getClass());

		@Override
		public void configure(AuthenticationManagerBuilder auth) throws Exception {
			// UserDetailsService 받고
			List<BeanWithName<UserDetailsService>> userDetailsServices = getBeansWithName(UserDetailsService.class);
			if (auth.isConfigured()) {
				...
				return;
			}
			...
			UserDetailsService userDetailsService = userDetailsServices.get(0).getBean();
			String userDetailsServiceBeanName = userDetailsServices.get(0).getName();
			PasswordEncoder passwordEncoder = getBeanOrNull(PasswordEncoder.class);
			UserDetailsPasswordService passwordManager = getBeanOrNull(UserDetailsPasswordService.class);
			CompromisedPasswordChecker passwordChecker = getBeanOrNull(CompromisedPasswordChecker.class);
			DaoAuthenticationProvider provider;
			// DaoAuthenticationProvider 생성
			if (passwordEncoder != null) {
				provider = new DaoAuthenticationProvider(passwordEncoder);
			}
			else {
				provider = new DaoAuthenticationProvider();
			}
			...
```
- `DaoAuthenticationProvider` 생성 확인


#### 사용 방법
1. 일반 객체로 생성
```java
public class CustomAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {

        String loginId = authentication.getName();
        String password = (String) authentication.getCredentials();

        // id 검증
        // pw 검증

        return new UsernamePasswordAuthenticationToken
                (loginId, password, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.isAssignableFrom(UsernamePasswordAuthenticationToken.class);
    }
}
```

```java
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.authenticationProvider(new CustomAuthenticationProvider());
        builder.authenticationProvider(new CustomAuthenticationProvider2());

        http
                .authorizeHttpRequests(auth-> auth
//                        .requestMatchers("/").permitAll()
                        .anyRequest().authenticated())
                .formLogin(Customizer.withDefaults())
//                .authenticationProvider(new CustomAuthenticationProvider())
//                .authenticationProvider(new CustomAuthenticationProvider2())
        ;
        return http.build();
    }
```

**[AuthenticationProvider 생성]**

`UsernamePasswordAuthenticationFilter.attemptAuthentication()` → `return this.getAuthenticationManager().authenticate(authRequest);`

![image](/images/lecture/spring-security-s4-10.png)

- 기본으로 생성된 providers 앞에 CustomAuthenticationProvider, CustomAuthenticationProvider2 커스텀 프로바이더 걸린 것 확인
- 디폴트 프로바이더(AnnonymousAuthenticationProvider, DaoAuthentiationProvider)는 원래 셋팅 유지됨

2. 빈으로 생성

(1) 빈을 한 개만 정의할 경우 [기본 설정]
```java
@EnableWebSecurity
@Configuration
public class SecurityConfig2 {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth-> auth
//                        .requestMatchers("/").permitAll()
                        .anyRequest().authenticated())
                .formLogin(Customizer.withDefaults())
        ;
        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        return new CustomAuthenticationProvider();
    }
    ...
```

![image](/images/lecture/spring-security-s4-11.png)

- AuthenticationProvider를 빈으로 정의하면 DaoAuthenticationBuilder가 자동으로 CustomAuthenticationFilter로 대체되는 것을 확인할 수 있다. (빈을 하나만 정의하는 경우 원래 셋팅이 바뀜. 크게 문제는 없다.)

(2) 빈을 한 개만 정의할 경우 [원래 셋팅 보존하고 싶을 때]

```java
@EnableWebSecurity
@Configuration
public class SecurityConfig2 {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationManagerBuilder builder,
                                                   AuthenticationConfiguration configuration) throws Exception {
        AuthenticationManagerBuilder managerBuilder = http.getSharedObject(AuthenticationManagerBuilder.class);
        // AnnonymousAuthenticationProvider 위에 커스텀 프로바이더 얹겠다.
        managerBuilder.authenticationProvider(customAuthenticationProvider());

        // parent DaoAuthenticationProvider로 원복
        ProviderManager authenticationManager = (ProviderManager) configuration.getAuthenticationManager();
        authenticationManager.getProviders().remove(0);     // parent.provider에 디폴트로 셋팅된 커스텀 프로바이더 제거
        builder.authenticationProvider(new DaoAuthenticationProvider());    // DaoAuthenticationProvider 추가

        http
                .authorizeHttpRequests(auth-> auth
                        .anyRequest().authenticated())
                .formLogin(Customizer.withDefaults())
        ;
        return http.build();
    }

    @Bean
    public AuthenticationProvider customAuthenticationProvider() {
        return new CustomAuthenticationProvider();
    }
    ...
```
![image](/images/lecture/spring-security-s4-12.png)

- this.ProviderManager는 HttpSecurity에서 불러온 AuthenticationManagerBuilder가 만든 ProviderManager
- parent.ProviderManager는 AuthenticationConfiguration이 만들었다.
- AuthenticationConfiguration에 의해 만들어진 ProviderManager는 메서드 파라미터로 받은 AuthenticationManagerBuilder가 생성한다.

(3) 빈을 두 개 이상 정의할 경우
```java
@EnableWebSecurity
@Configuration
public class SecurityConfig3 {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, HttpSecurity httpSecurity) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.authenticationProvider(customAuthenticationProvider());
        builder.authenticationProvider(customAuthenticationProvider2());

        http
                .authorizeHttpRequests(auth-> auth
//                        .requestMatchers("/").permitAll()
                        .anyRequest().authenticated())
                .formLogin(Customizer.withDefaults())
        ;
        return http.build();
    }

    @Bean
    public AuthenticationProvider customAuthenticationProvider() {
        return new CustomAuthenticationProvider();
    }

    @Bean
    public AuthenticationProvider customAuthenticationProvider2() {
        return new CustomAuthenticationProvider();
    }
    ...
```
![image](/images/lecture/spring-security-s4-13.png)

- 2개 이상의 빈을 생성 및 셋팅하면 원래 셋팅이 유지되는 것을 확인할 수 있다.


## References

- 스프링 시큐리티 완전 정복 [6.x 개정판] / 인프런 / 정수원