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