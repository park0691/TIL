# 인증 프로세스

## 폼 인증

- HTTP 기반의 폼 로그인 인증 매커니즘을 활성화하는 API로 사용자 인증을 위한 사용자 정의 로그인 페이지를 쉽게 구현할 수 있다.
- 기본 로그인 페이지를 사용하며 username, password 필드가 포함된 간단한 로그인 양식을 제공한다.
- 사용자는 웹 폼을 통해 자격 증명(username, password)를 제공하고 스프링 시큐리티는 HttpServletRequest에서 이 값을 읽어온다.

**[흐름]**
![image](/images/lecture/spring-security-s3-1.png)

1. **GET /user** 요청 발생
2. `AuthotizationFilter`가 /user 접근 권한 있는지 체크한다.
3. 인증 받지 못했으면 접근 예외 발생 → `AccessDeniedException`
4. `ExceptionTranslationFilter` 는 `AuthenticationEntryPoint` 호출
5. `AuthenticationEntryPoint` 는 인증할 수 있도록 로그인 페이지로 리다이렉트 한다.

### formLogin() API
- FormLoginConfigurer 설정 클래스를 통해 여러 API를 설정한다.
- 내부적으로 `UsernamePasswordAuthenticationFilter`가 생성되어 폼 방식의 인증 처리를 담당한다.

```java
HttpSecurity.formLogin(httpSecurityFormLoginConfigurer -> httpSecurityFormLoginConfigurer
    .loginPage("/loginPage")                        // 사용자 정의 로그인 페이지로 전환 (기본 로그인 페이지 무시)
    .loginProcessingUrl("/loginProc")               // 사용자 이름과 비밀번호를 검증할 URL 지정 (HTML Form Action)
    .defaultSuccessUrl("/", [alwaysUse])            // 로그인 성공 이후 이동 페이지, alwaysUse가 true면 무조건 지정된 위치로 이동 (기본은 false)
                                                    // 인증 전에 보안이 필요한 페이지를 방문하다가 인증에 성공한 경우 이전 위치로 리다이렉트
    .failureUrl("/failed")                          // 인증에 실패한 경우 사용자에게 보낼 URL 지정, 기본값은 "/login?error"
    .usernameParameter("username")                  // 인증을 수행할 때 사용자 이름(아이디) 찾기 위해 확인하는 HTTP 매개변수 설정 (기본값은 username)
    .passwordParameter("password")                  // 인증을 수행할 때 비밀번호를 찾기 위해 확인하는 HTTP 매개변수 설정 (기본값은 password)
    .successHandler(AuthenticationSuccessHandler)   // 인증 성공 시 사용할 AuthenticationSuccessHandler 지정
                                                    // 기본값은 SavedRequestAwareAuthenticationSuccessHandler
                                                    // failureUrl(), loginPage(), loginProcessingUrl() 에 대한 URL에 대한 모든 사용자의 접근을 허용
    .failureHandler(AuthenticationFailureHandler)   // 인증 실패 시 사용할 AuthenticationFailureHandler 지정
                                                    // 기본값은 SimpleUrlAuthenticationFailureHandler를 사용하여 "/login?error"로 리다이렉트
    .permitAll()                                    // failureUrl(), loginPage(), loginProcessingUrl() 에 대한 URL에 모든 사용자의 접근 허용
);
```

**[예시 코드]**
```java
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http.authorizeHttpRequests(auth-> auth.anyRequest().authenticated())
            .formLogin(form -> form
                .loginPage("/loginPage")
                .loginProcessingUrl("/loginProc")
                .defaultSuccessUrl("/", false)
                .failureUrl("/failed")
                .usernameParameter("userId")
                .passwordParameter("passwd")
                .successHandler(new AuthenticationSuccessHandler() {
                    @Override
                    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
                        System.out.println("authentication : " + authentication);
                        response.sendRedirect("/home");
                    }
                })
                .failureHandler((request, response, exception) -> {
                    System.out.println("exception : " + exception.getMessage());
                    response.sendRedirect("/login");
                })
                .permitAll()
            );

        return http.build();
    }
}
```

- `defaultSuccessUrl, defaultSuccessUrl`보다 `successHandler, failureHandler`가 우선한다.

**[동작 과정]**

- `HttpSecurity.formLogin()`
```java
public HttpSecurity formLogin(Customizer<FormLoginConfigurer<HttpSecurity>> formLoginCustomizer) throws Exception {
    formLoginCustomizer.customize(getOrApply(new FormLoginConfigurer<>()));
    return HttpSecurity.this;
}
```

FormLoginConfigurer() 생성자 호출

```java
public final class FormLoginConfigurer<H extends HttpSecurityBuilder<H>> extends
		AbstractAuthenticationFilterConfigurer<H, FormLoginConfigurer<H>, UsernamePasswordAuthenticationFilter> {
	...
    public FormLoginConfigurer() {
        super(new UsernamePasswordAuthenticationFilter(), null);
        usernameParameter("username");
        passwordParameter("password");
    }
    ...
```

- 폼 인증을 처리하는 필터는 `UsernamePasswordAuthenticationFilter`
- `FormLoginConfigurer`의 부모 클래스는 `AbstractAuthenticationFilterConfigurer`

**`AbstractAuthenticationFilterConfigurer`의 init(), configure() 로직**
```java
public abstract class AbstractAuthenticationFilterConfigurer<B extends HttpSecurityBuilder<B>, T extends AbstractAuthenticationFilterConfigurer<B, T, F>, F extends AbstractAuthenticationProcessingFilter>
		extends AbstractHttpConfigurer<T, B> {
	...
	@Override
	public void init(B http) throws Exception {
		updateAuthenticationDefaults();
		updateAccessDefaults(http);
		registerDefaultAuthenticationEntryPoint(http);
	}
	...
	protected final void updateAuthenticationDefaults() {
		if (this.loginProcessingUrl == null) {
			loginProcessingUrl(this.loginPage);
		}
		if (this.failureHandler == null) {
			failureUrl(this.loginPage + "?error");
		}
		LogoutConfigurer<B> logoutConfigurer = getBuilder().getConfigurer(LogoutConfigurer.class);
		if (logoutConfigurer != null && !logoutConfigurer.isCustomLogoutSuccess()) {
			logoutConfigurer.logoutSuccessUrl(this.loginPage + "?logout");
		}
	}
	...
	protected final void updateAccessDefaults(B http) {
		if (this.permitAll) {
			PermitAllSupport.permitAll(http, this.loginPage, this.loginProcessingUrl, this.failureUrl);
		}
	}
	...
	@Override
	public void configure(B http) throws Exception {
		PortMapper portMapper = http.getSharedObject(PortMapper.class);
		if (portMapper != null) {
			this.authenticationEntryPoint.setPortMapper(portMapper);
		}
		RequestCache requestCache = http.getSharedObject(RequestCache.class);
		if (requestCache != null) {
			this.defaultSuccessHandler.setRequestCache(requestCache);
		}
                this.authFilter.setAuthenticationManager(http.getSharedObject(AuthenticationManager.class));
                this.authFilter.setAuthenticationSuccessHandler(this.successHandler);
                this.authFilter.setAuthenticationFailureHandler(this.failureHandler);
		if (this.authenticationDetailsSource != null) {
			this.authFilter.setAuthenticationDetailsSource(this.authenticationDetailsSource);
		}
		SessionAuthenticationStrategy sessionAuthenticationStrategy = http
			.getSharedObject(SessionAuthenticationStrategy.class);
		if (sessionAuthenticationStrategy != null) {
			this.authFilter.setSessionAuthenticationStrategy(sessionAuthenticationStrategy);
		}
		RememberMeServices rememberMeServices = http.getSharedObject(RememberMeServices.class);
		if (rememberMeServices != null) {
			this.authFilter.setRememberMeServices(rememberMeServices);
		}
		SecurityContextConfigurer securityContextConfigurer = http.getConfigurer(SecurityContextConfigurer.class);
		if (securityContextConfigurer != null && securityContextConfigurer.isRequireExplicitSave()) {
			SecurityContextRepository securityContextRepository = securityContextConfigurer
				.getSecurityContextRepository();
			this.authFilter.setSecurityContextRepository(securityContextRepository);
		}
		this.authFilter.setSecurityContextHolderStrategy(getSecurityContextHolderStrategy());
		F filter = postProcess(this.authFilter);
		http.addFilter(filter);
	}
	...
```

- `configure()`
	- authFilter(`UsernamePasswordAuthenticationFilter`)에 여러 설정을 하는 것을 확인.
    - SessionAuthenticationStrategy, RememberMeServices, SecurityContextConfigurer 여러 클래스 사용하는 것 확인
    - HttpSecurity에 필터 추가 등

### UsernamePasswordAuthenticationFilter
![image](/images/lecture/spring-security-s3-2.png)

- 스프링 시큐리티는 AbstractAuthenticationProcessingFilter 클래스를 사용자의 자격 증명을 인증하는 기본 필터로 사용한다
- UsernamePasswordAuthenticationFilter는 AbstractAuthenticationProcessingFilter를 확장한 클래스로서 HttpServletRequest에서 제출된 사용자 이름과 비밀번호로부터 인증을 수행한다.
- 인증 프로세스가 초기화 될 때 로그인 페이지와 로그아웃 페이지 생성을 위한 `DefaultLoginPageGeneratingFilter` 및 `DefaultLogoutPageGeneratingFilter` 가 초기화된다.

**[흐름도]**
![image](/images/lecture/spring-security-s3-3.png)

- 인증이 필요한지 RequestMatcher를 통해 URL을 검증하고 인증이 필요한 요청만 인증을 진행한다.
- ID, PW를 `UsernamePasswordAuthenticationToken`에 저장하고, 해당 토큰을 `AuthenticationManager`로 전달한다.
- `AuthenticationManager`는 받은 토큰으로 해당 ID, PW가 DB에 저장된 데이터와 맞는지 체크한다.
- 인증 성공 시
    - `UsernamePasswordAuthenticationToken`을 다시 만든다. (UserDetails + Authorities)
        - 최종 인증에 성공한 사용자의 권한 및 다양한 정보 저장
    - `SessionAuthenticationStrategy` 클래스 통해서 새로운 로그인 알린다.
        - 세션 관련 작업 (인증 상태 유지)
    - `Authentication`을 `SecurityContext`에 설정한다.
        - 세션에 `SecurityContext`가 저장
    - `RememberMeServices.loginSuccess()` 호출한다. (RememberMe가 설정된 경우 / 자동 로그인 같은 기능)
    - 인증 성공 이벤트를 게시 : `ApplicationEventPublisher`
    - 인증 성공 핸들러를 호출 : `ApplicationSuccessHandler`
- 인증 실패 시
    - `SecurityContextHolder` 이전 인증 상태를 유지하기 위한 컨텍스트가 있다면 삭제
    - `RememberMeServices.loginFail()` 호출
    - 인증 실패 핸들러 호출 : `AuthenticationFailureHandler`

**[동작 과정]**
```java
public abstract class AbstractAuthenticationProcessingFilter extends GenericFilterBean
    implements ApplicationEventPublisherAware, MessageSourceAware {
	...
	private void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		if (!requiresAuthentication(request, response)) {
			chain.doFilter(request, response);
			return;
		}
		try {
			// 인증 처리
			Authentication authenticationResult = attemptAuthentication(request, response);
			if (authenticationResult == null) {
				// return immediately as subclass has indicated that it hasn't completed
				return;
			}
			// 세션 관련 작업 수행
			this.sessionStrategy.onAuthentication(authenticationResult, request, response);
			// Authentication success
			if (this.continueChainBeforeSuccessfulAuthentication) {
				chain.doFilter(request, response);
			}
			successfulAuthentication(request, response, chain, authenticationResult);
		}
		catch (InternalAuthenticationServiceException failed) {
			this.logger.error("An internal error occurred while trying to authenticate the user.", failed);
			unsuccessfulAuthentication(request, response, failed);
		}
		catch (AuthenticationException ex) {
			// Authentication failed
			unsuccessfulAuthentication(request, response, ex);
		}
	}
	...
```

- requiresAuthentication()
![image](/images/lecture/spring-security-s3-4.png)
RequestMatcher에 의해 인증이 필요한지 체크하는 로직 확인

- attemptAuthentication()
```java
public class UsernamePasswordAuthenticationFilter extends AbstractAuthenticationProcessingFilter {
	...
	@Override
	public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
			throws AuthenticationException {
		if (this.postOnly && !request.getMethod().equals("POST")) {
			throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
		}
		String username = obtainUsername(request);
		username = (username != null) ? username.trim() : "";
		String password = obtainPassword(request);
		password = (password != null) ? password : "";
		UsernamePasswordAuthenticationToken authRequest = UsernamePasswordAuthenticationToken.unauthenticated(username,
				password);
		// Allow subclasses to set the "details" property
		setDetails(request, authRequest);
		return this.getAuthenticationManager().authenticate(authRequest);
	}
```
사용자 이름, 패스워드 가져오는 부분 확인

두 정보를 이용해서 `UsernamePasswordAuthenticationToken`에 저장

`this.getAuthenticationManager().authenticate(authRequest)`<br/>
→ AuthenticationManager 객체 참조해서 인증 처리 위임

인증 처리 후 `AbstractAuthenticationProcessingFilter`
![image](/images/lecture/spring-security-s3-5.png)
Authentication.principal 내에 가져온 사용자 데이터 확인

`this.sessionStrategy.onAuthentication(authenticationResult, request, response)`
세션 처리 작업

successfulAuthentication() 호출

```java
public abstract class AbstractAuthenticationProcessingFilter extends GenericFilterBean
    implements ApplicationEventPublisherAware, MessageSourceAware {
    ...
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
            Authentication authResult) throws IOException, ServletException {
        SecurityContext context = this.securityContextHolderStrategy.createEmptyContext();
        context.setAuthentication(authResult);
        this.securityContextHolderStrategy.setContext(context);
        this.securityContextRepository.saveContext(context, request, response);
        if (this.logger.isDebugEnabled()) {
            this.logger.debug(LogMessage.format("Set SecurityContextHolder to %s", authResult));
        }
        this.rememberMeServices.loginSuccess(request, response, authResult);
        if (this.eventPublisher != null) {
            this.eventPublisher.publishEvent(new InteractiveAuthenticationSuccessEvent(authResult, this.getClass()));
        }
        this.successHandler.onAuthenticationSuccess(request, response, authResult);
    }
```
인증 상태를 SecurityContext에 저장하는 부분 확인

- 세션에 컨텍스트 저장
    - this.securityContextRepository.saveContext() → HttpSessionSecurityContextRepository.saveContextInHttpSession() → HttpSessionSecurityContextRepository.setContextInSession()

```java
public class HttpSessionSecurityContextRepository implements SecurityContextRepository {
	...
	private void setContextInSession(SecurityContext context, HttpSession session) {
		if (session != null) {
			// 세션에 컨텍스트 저장
			session.setAttribute(this.springSecurityContextKey, context);
			if (this.logger.isDebugEnabled()) {
				this.logger.debug(LogMessage.format("Stored %s to HttpSession [%s]", context, session));
			}
		}
	}
```

`this.rememberMeServices.loginSuccess()` 호출

`this.eventPublisher.publishEvent()` 로그인 성공 이벤트 발행

`this.successHandler.onAuthenticationSuccess()` 성공 핸들러로 이동 경로 등 작업 수행

```java
public class SavedRequestAwareAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
	...
	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
			Authentication authentication) throws ServletException, IOException {
		SavedRequest savedRequest = this.requestCache.getRequest(request, response);
		if (savedRequest == null) {
			super.onAuthenticationSuccess(request, response, authentication);
			return;
		}
		String targetUrlParameter = getTargetUrlParameter();
		if (isAlwaysUseDefaultTargetUrl()
				|| (targetUrlParameter != null && StringUtils.hasText(request.getParameter(targetUrlParameter)))) {
			this.requestCache.removeRequest(request, response);
			super.onAuthenticationSuccess(request, response, authentication);
			return;
		}
		clearAuthenticationAttributes(request);
		// Use the DefaultSavedRequest URL
		String targetUrl = savedRequest.getRedirectUrl();
		getRedirectStrategy().sendRedirect(request, response, targetUrl);
	}
```
targetUrl 셋팅 과정 확인

**[인증 실패 시]**
아이디 / 패스워드 잘못 입력 시 `AbstractAuthenticationProcessingFilter`
![image](/images/lecture/spring-security-s3-6.png)

`BadCredentialsException` 발생 확인

```java
public abstract class AbstractAuthenticationProcessingFilter extends GenericFilterBean
	implements ApplicationEventPublisherAware, MessageSourceAware {
	...
	protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException failed) throws IOException, ServletException {
		this.securityContextHolderStrategy.clearContext();
		this.logger.trace("Failed to process authentication request", failed);
		this.logger.trace("Cleared SecurityContextHolder");
		this.logger.trace("Handling authentication failure");
		this.rememberMeServices.loginFail(request, response);
		this.failureHandler.onAuthenticationFailure(request, response, failed);
	}
```

SecurityContextHolder 삭제, RememberMeService.loginFail() 호출 확인

이후 인증 실패 핸들러 `failureHandler.onAuthenticationFailure()` 호출 확인

```java
public class SimpleUrlAuthenticationFailureHandler implements AuthenticationFailureHandler {
	...
	@Override
	public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException exception) throws IOException, ServletException {
		if (this.defaultFailureUrl == null) {
			if (this.logger.isTraceEnabled()) {
				this.logger.trace("Sending 401 Unauthorized error since no failure URL is set");
			}
			else {
				this.logger.debug("Sending 401 Unauthorized error");
			}
			response.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
			return;
		}
		saveException(request, exception);
		if (this.forwardToDestination) {
			this.logger.debug("Forwarding to " + this.defaultFailureUrl);
			request.getRequestDispatcher(this.defaultFailureUrl).forward(request, response);
		}
		else {
			this.redirectStrategy.sendRedirect(request, response, this.defaultFailureUrl);
		}
	}
```

defaultFailureUrl 셋팅 과정 확인

## 기본 인증
### HTTP Basic 인증
- HTTP 는 액세스 제어와 인증을 위한 프레임워크를 제공하며 가장 일반적인 인증 방식은 Basic 인증 방식이다.
- RFC 7235 표준이며 인증 프로토콜은 HTTP 인증 헤더에 기술되어 있다.

![image](/images/lecture/spring-security-s3-7.png)
_출처 : http://www.asp.net/web-api/overview/security/basic-authentication_

::: warning
- base-64 인코딩 된 값은 디코딩 가능하기 때문에 인증 정보가 노출된다.
- HTTP Basic 인증은 반드시 HTTPS와 같이 TLS 기술과 함께 사용해야 한다.
:::

1. 클라이언트는 인증 정보 없이 서버로 접속을 시도한다
2. 서버가 클라이언트에게 인증요구를 보낼 때 401 Unauthorized 응답과 함께 WWW-Authenticate 헤더를 기술해서 realm(보안 영역)과 Basic 인증 방법을 보낸다.
	- `Www-Authenticate: Basic realm="security"`
3. 브라우저는 Www-Authenticate 헤더를 인식하고 로그인 프롬프트를 표시한다.
4. 사용자가 입력한 username과 password를 Base64로 인코딩하고 Authorization 헤더에 담아서 요청한다.
	- `Authorization: Basic YWxpY2U6c6GFzc3dvcmQ=`
5. 서버는 `Authorization` 헤더를 디코딩하여 인증을 수행하며, 인증이 성공하면 정상적인 상태 코드를 반환한다.

::: warning Realm (보안 영역)
보호되는 리소스의 범위를 나타내는 문자열로 사용자에게 어떤 영역에 대한 인증을 요구하고 있는지 알려주는 역할을 한다.
예를 들어, "관리자 영역" 또는 "사용자 프로필"과 같이 지정될 수 있다.
클라이언트는 이 realm 정보를 보고 어떤 자격 증명을 사용할지 결정할 수 있다.
:::

### httpBasic() API
- HttpBasicConfigurer 설정 클래스를 통해 여러 API 들을 설정할 수 있다
- 내부적으로 BasicAuthenticationFilter가 생성되어 기본 인증 방식의 인증 처리를 담당하게 된다

```java
HttpSecurity.httpBasic(httpSecurityBasicConfigurer -> httpSecurityBasicConfigurer
	.realmName("security")							// HTTP 기본 영역을 설정
	.authenticationEntryPoint(
		(request, response, authException) -> {}	// 인증 실패시 호출되는 AuthenticationEntryPoint
	)												// 기본값은 "Realm" 영역으로 BasicAuthenticationEntryPoint가 사용
)
```

기본 설정 후
```java
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, HttpSecurity httpSecurity) throws Exception{
        http.authorizeHttpRequests(auth-> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }
```

루트 '/' 경로로 요청 (`localhost:8080`) 후 응답 확인
![image](/images/lecture/spring-security-s3-8.png)

브라우저는 `Www-Authenticate` 헤더를 보고 Basic 인증 방식으로 제공했다.
- 401 Unauthorized 응답 전달 확인
- Www-Authenticate 헤더는 클라이언트에게 인증이 필요하다는 것을 알려준다.
	- HTTP 표준에 따르면 서버는 인증이 필요한 경우 WWW-Authenticate 헤더를 포함해야 한다.
	- `Basic`을 통해 HTTP Basic 인증 방식이 필요하다는 것을 알 수 있다.

![image](/images/lecture/spring-security-s3-9.png)

같은 설정을 `AuthenticationEntryPoint` 커스텀 클래스로 만들기
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, HttpSecurity httpSecurity) throws Exception{
    http.authorizeHttpRequests(auth-> auth.anyRequest().authenticated())
            .httpBasic(basic -> basic.authenticationEntryPoint(new CustomAuthenticationEntryPoint()));
    return http.build();
}

public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        response.setHeader("WWW-Authenticate", "Basic realm=security");
        response.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
    }
}
```

### BasicAuthenticationFilter
- 기본 인증 서비스를 제공하는 데 사용된다.
- `BasicAuthenticationConverter`를 사용해서 요청 헤더에 기술된 인증 정보의 유효성을 체크하여 Base64 인코딩된 username과 password를 추출한다.
- 폼 인증과 달리 매번 인증을 거쳐야 한다.
	- 폼 인증은 세션을 사용 (컨텍스트를 세션에 저장) 하여 매 요청마다 인증을 거치지 않지만, 기본 인증 방식은 세션을 사용하지 않기 때문에 매 요청마다 인증을 거쳐야 한다.
	- 요청 컨텍스트마다 Security Context 저장되므로 요청 하나가 처리되는 동안만 유지된다.

**[흐름도]**
![image](/images/lecture/spring-security-s3-10.png)

```java
public class BasicAuthenticationFilter extends OncePerRequestFilter {
	...
	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		try {
			// 요청 헤더 인증정보 유효성 체크
			Authentication authRequest = this.authenticationConverter.convert(request);
			...
			if (authenticationIsRequired(username)) {
				Authentication authResult = this.authenticationManager.authenticate(authRequest);
				SecurityContext context = this.securityContextHolderStrategy.createEmptyContext();
				context.setAuthentication(authResult);
				this.securityContextHolderStrategy.setContext(context);
				...
				this.rememberMeServices.loginSuccess(request, response, authResult);
				// securityContextRepository는 RequestAttributeContextSecurityRepository에 의존
				// Request Context에 컨텍스트를 저장 (요청이 다시 오면 매번 인증 거쳐야 함)
				this.securityContextRepository.saveContext(context, request, response);
				onSuccessfulAuthentication(request, response, authResult);
			}
			...
```

## 기억 인증(RememberMe)
- 사용자가 웹 사이트나 애플리케이션에 로그인할 때 자동으로 인증 정보를 기억하는 기능이다
- UsernamePasswordAuthenticationFilter 와 함께 사용되며, AbstractAuthenticationProcessingFilter 슈퍼클래스에서 훅을 통해 구현된다
	- 인증 성공 시 RememberMeServices.loginSuccess() 를 통해 RememberMe 토큰을 생성하고 쿠키로 전달한다.
	- 인증 실패 시 RememberMeServices.loginFail() 를 통해 쿠키를 지운다.
	- LogoutFilter 와 연계해서 로그아웃 시 쿠키를 지운다.
### 토큰 생성
- 기본적으로 암호화된 토큰으로 생성되며 브라우저에 쿠키를 보내고, 향후 세션에서 이 쿠키를 감지하여 자동 로그인이 이루어진다.
- `base64(username:expirationTime:algorithmName:algorithmHex(username:expirationTime:password:key))`
    - username: UserDetailsService 로 식별 가능한 사용자 이름
    - password: 검색된 UserDetails 에 일치하는 비밀번호
    - expirationTime: remember-me 토큰이 만료되는 날짜와 시간, 밀리초로 표현
    - key: remember-me 토큰의 수정을 방지하기 위한 개인 키
    - algorithmName: remember-me 토큰 서명을 생성하고 검증하는 데 사용되는 알고리즘(기본적으로 SHA-256 알고리즘을 사용)

### RememberMeServices 구현체
- `TokenBasedRememberMeServices`
	- 쿠키 기반 토큰의 보안을 위해 해싱을 사용한다.
- `PersistentTokenBasedRememberMeServices`
	- 생성된 토큰을 저장하기 위해 데이터베이스나 다른 영구 저장 매체를 사용한다.
- 두 구현체 모두 사용자의 정보를 검색하기 위한 UserDetailsService 가 필요하다.

### rememberMe() API
- RememberMeConfigurer 설정 클래스를 통해 여러 API 들을 설정할 수 있다.
- 내부적으로 RememberMeAuthenticationFilter가 생성되어 자동 인증 처리를 담당한다.

```java
HttpSecurity.rememberMe(httpSecurityRememberMeConfigurer -> httpSecurityRememberMeConfigurer
            .alwaysRemember(true)						// 기억하기(remember-me) 매개변수가 설정되지 않았을 때도 쿠키가 항상 생성되어야 함
            .tokenValiditySeconds(3600)					// 토큰 유효 시간(초 단위
            .userDetailsService(userDetailsService())	// UserDetails 조회 위해 사용되는 UserDetailsService를 지정
            .rememberMeParameter("remember")			// 로그인 시 사용자를 기억하기 위해 사용되는 HTTP 매개변수(기본값은 'remember-me')
            .rememberMeCookieName("remember")			// 기억하기 인증(remember-me) 인증을 위한 토큰을 저장하는 쿠키 이름(기본값은 'remember-me')
            .key("security")							// 기억하기(remember-me) 인증을 위해 생성된 토큰을 식별하는 키 설정
    );
```

**[예시 코드]**
```java
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, HttpSecurity httpSecurity) throws Exception{
        http.authorizeHttpRequests(auth-> auth.anyRequest().authenticated())
                .formLogin(Customizer.withDefaults())
                .rememberMe(rememberMe -> rememberMe
//                        .alwaysRemember(true)
                        .tokenValiditySeconds(3600)
                        .userDetailsService(userDetailsService())
                        .rememberMeParameter("remember")
                        .rememberMeCookieName("remember")
                        .key("security")
                );
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails user = User.withUsername("user")
                .password("{noop}1234")
                .authorities("USER")
                .build();
        return new InMemoryUserDetailsManager(user);
    }
}
```

체크 후 로그인하면
![image](/images/lecture/spring-security-s3-11.png)

`remember` 쿠키 값이 생성된 것을 확인할 수 있다.
![image](/images/lecture/spring-security-s3-12.png)

### RememberMeAuthenticationFilter
![image](/images/lecture/spring-security-s3-13.png)

- SecurityContextHolder에 Authentication이 포함되지 않은 경우 실행되는 필터<br/>
	(인증을 이미 받은 경우 기억하기 인증을 할 필요가 없기 때문)
- 세션이 만료되었거나 어플리케이션 종료로 인증 상태가 소멸된 경우 토큰 기반 인증을 사용해 유효성을 검사하고 토큰이 검증되면 자동 로그인 처리를 수행한다.
- 세션에 SecurityContext를 저장하는 부분은 폼 인증과 동일

**[토큰 생성, 쿠키 전송]**
- UsernamePasswordAuthenticationFilter가 한다.

ID/PW 입력 remember-me 체크 후 로그인

```java
public abstract class AbstractAuthenticationProcessingFilter extends GenericFilterBean
		implements ApplicationEventPublisherAware, MessageSourceAware {
	...
	protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
			Authentication authResult) throws IOException, ServletException {
		...
		this.rememberMeServices.loginSuccess(request, response, authResult);
```
`rememberMeServices.loginSuccess()` 호출

```java
@Override
public void loginSuccess(HttpServletRequest request, HttpServletResponse response,
        Authentication successfulAuthentication) {
    if (!rememberMeRequested(request, this.parameter)) {
        this.logger.debug("Remember-me login not requested.");
        return;
    }
    onLoginSuccess(request, response, successfulAuthentication);
}
```
`onLoginSuccess()` 호출

```java
@Override
public void onLoginSuccess(HttpServletRequest request, HttpServletResponse response,
        Authentication successfulAuthentication) {
    String username = retrieveUserName(successfulAuthentication);
    String password = retrievePassword(successfulAuthentication);
    ...
    // 토큰 서명 생성
    String signatureValue = makeTokenSignature(expiryTime, username, password, this.encodingAlgorithm);
    // 쿠키 생성
    setCookie(new String[] { username, Long.toString(expiryTime), this.encodingAlgorithm.name(), signatureValue },
            tokenLifetime, request, response);
    if (this.logger.isDebugEnabled()) {
        this.logger
            .debug("Added remember-me cookie for user '" + username + "', expiry: '" + new Date(expiryTime) + "'");
    }
}
```

**[인증 과정]**
- `RememberMeServices.autoLogin()`
	- 사용자 정보(UserDetails + Authorities) 가져와서 RememberMeAuthenticationToken을 만든 후 이 토큰을 AuthenticationManager에게 전달하여 인증 처리를 수행한다.

```java
public class RememberMeAuthenticationFilter extends GenericFilterBean implements ApplicationEventPublisherAware {
	...
	private void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		// 인증 상태에 있다면 -> 자동 인증할 필요 없음
		// 세션에 저장된 시큐리티 컨텍스트 값 읽어옴 (JSESSIONID로)
		if (this.securityContextHolderStrategy.getContext().getAuthentication() != null) {
			chain.doFilter(request, response);
			return;
		}
		Authentication rememberMeAuth = this.rememberMeServices.autoLogin(request, response);
```
리멤버미 체크 로그인 된 상태로 특정 URL 입력 시 `localhost:8080/`

→ `this.securityContextHolderStrategy.getContext().getAuthentication()`는 null이 아니다. 세션에서 컨텍스트 가져올 수 있기 때문.

![image](/images/lecture/spring-security-s3-14.png)

브라우저 쿠키에서 JSESSIONID 제거하면 `this.securityContextHolderStrategy.getContext().getAuthentication()`는 null이다.

남아있는 remember 쿠키 때문에 자동 인증이 수행된다. (아래 코드 로직 수행)

this.rememberMeServices.autoLogin() → AbstractRememberMeServices.createSuccessfulAuthentication() 호출

```java
public abstract class AbstractRememberMeServices
		implements RememberMeServices, InitializingBean, LogoutHandler, MessageSourceAware {
	...
	protected Authentication createSuccessfulAuthentication(HttpServletRequest request, UserDetails user) {
		RememberMeAuthenticationToken auth = new RememberMeAuthenticationToken(this.key, user,
				this.authoritiesMapper.mapAuthorities(user.getAuthorities()));
		auth.setDetails(this.authenticationDetailsSource.buildDetails(request));
		return auth;
	}
```
RememberMeAuthenticationToken 생성하여 반환한다.

```java
public class RememberMeAuthenticationFilter extends GenericFilterBean implements ApplicationEventPublisherAware {
	...
	protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
			Authentication authResult) throws IOException, ServletException {
		...
		Authentication rememberMeAuth = this.rememberMeServices.autoLogin(request, response);
		if (rememberMeAuth != null) {
			// Attempt authentication via AuthenticationManager
			try {
				rememberMeAuth = this.authenticationManager.authenticate(rememberMeAuth);
				// Store to SecurityContextHolder
				SecurityContext context = this.securityContextHolderStrategy.createEmptyContext();
				context.setAuthentication(rememberMeAuth);
				this.securityContextHolderStrategy.setContext(context);
				onSuccessfulAuthentication(request, response, rememberMeAuth);
				this.logger.debug(LogMessage.of(() -> "SecurityContextHolder populated with remember-me token: '"
						+ this.securityContextHolderStrategy.getContext().getAuthentication() + "'"));
				this.securityContextRepository.saveContext(context, request, response);
				if (this.eventPublisher != null) {
					this.eventPublisher.publishEvent(new InteractiveAuthenticationSuccessEvent(
							this.securityContextHolderStrategy.getContext().getAuthentication(), this.getClass()));
				}
				if (this.successHandler != null) {
					this.successHandler.onAuthenticationSuccess(request, response, rememberMeAuth);
					return;
				}
			}
			catch (AuthenticationException ex) {
				this.logger.debug(LogMessage
					.format("SecurityContextHolder not populated with remember-me token, as AuthenticationManager "
							+ "rejected Authentication returned by RememberMeServices: '%s'; "
							+ "invalidating remember-me token", rememberMeAuth),
						ex);
				this.rememberMeServices.loginFail(request, response);
				onUnsuccessfulAuthentication(request, response, ex);
			}
		}
		chain.doFilter(request, response);
	}
```
나머지 과정은 폼 인증과 유사하다.

![image](/images/lecture/spring-security-s3-15.png)
securityContextRepository 안에 HttpSessionSecurityContextRepository가 있는 것으로 보아 세션에 저장하는 것을 확인할 수 있다.

## References

- 스프링 시큐리티 완전 정복 [6.x 개정판] / 인프런 / 정수원