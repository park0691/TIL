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

## References
- 스프링 시큐리티 완전 정복 [6.x 개정판] / 인프런 / 정수원