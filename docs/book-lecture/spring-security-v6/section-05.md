# 인증 상태 영속성
## SecurityContextRepository
![image](/images/lecture/spring-security-s5-1.png)

- **인증 정보(SecurityContext)를 어디에 저장하고, 어떻게 불러올 것인가**를 결정하는 핵심 인터페이스
- 사용자가 인증하면, 해당 사용자의 인증 정보/권한이 `SecurityContext`에 저장되고, `HttpSession`을 통해 요청 간 영속이 이루어진다.

### 동작 흐름
1. 요청 도착: SecurityContextHolderFilter가 SecurityContextRepository.loadContext()를 실행
2. 정보 로드: 세션에 로그인 정보가 있다면 꺼내서 SecurityContextHolder에 세팅
3. 비즈니스 로직: 컨트롤러 등에서 인증된 사용자 정보를 사용
4. 인증 변경/성공: 만약 로그인 과정이라면, 인증 완료 후 SecurityContextRepository.saveContext()를 호출하여 세션에 정보를 저장

### 구조
![image](/images/lecture/spring-security-s5-2.png)

- HttpSessionSecurityContextRepository
	- HttpSession에 인증 정보(컨텍스트)를 저장한다.
	- 후속 요청 시 컨텍스트 영속성 유지
	- 일반적인 세션 기반 웹 앱에서 사용. 기본값
- RequestAttributeSecurityContextRepository
	- ServletRequest에 컨텍스트를 저장한다.
	- 후속 요청 시 컨텍스트 영속성 유지 불가
- NullSecurityContextRepository
	- 아무것도 저장하지 않고, 불러오지도 않는다. (컨텍스트 관련 처리 안 함)
	- 활용 : 세션을 사용하지 않는 인증인 경우 ~ JWT, OAuth2 API (Stateless)
- DelegatingSecurityContextRepository
	- 여러 저장소 전략을 동시에 사용할 때 사용한다.
	- HttpSessionSecurityContextRepository, RequestAttributeSecurityContextRepository 를 동시에 사용할 수 있도록 위임된 클래스. 초기화 시 기본으로 설정됨.

## SecurityContextHolderFilter
- **저장소(SecurityContextRepository)에서 인증 정보(SecurityContext)를 꺼내서 현재 실행 중인 스레드(SecurityContextHolder)에 세팅해주는 역할**을 담당

::: warning 스프링 시큐리티 6에서의 결정적 변화

스프링 시큐리티 6의 핵심 변화 중 하나가 바로 **인증 정보를 저장할 거면 네가 직접 말해라**다.

- **과거** : 이전 버전에서는 SecurityContextPersistenceFilter가 요청이 끝날 때 자동으로 세션에 정보를 저장했다. 편리하지만, 로그인이 필요 없는 페이지에서도 계속 세션에 접근하는 비효율이 있었다.

- **현재, 명시적 저장 (Explicit Save)** : 성능 최적화와 의도치 않은 세션 생성을 막기 위해, 이제는 인증이 성공했을 때 개발자가(혹은 필터가) 직접 `SecurityContextRepository.saveContext()`를 호출해야 한다.<br/>
SecurityContextHolderFilter는 기존의 자동 저장 필터 대신, 저장소에서 정보를 읽어오기만 하는 가벼운 필터로 대체되었다.<br/>
각 인증 메커니즘이 인증이 지속되어야 하는지 스스로 선택할 수 있게 하여 더 나은 유연성을 제공하고, HttpSession에 필요할 때만 저장함으로써 성능을 향상시켰다.
:::

### 흐름도
![image](/images/lecture/spring-security-s5-3.png)

- 세션에 SecurityContext 존재하지 않으면
    - 새로운 SecurityContext 생성하고 SecurityContextHolder에 저장한다. 이 때의 인증은 `null` 상태임.
    - 인증 필터가 인증에 성공하면 SecurityContext로부터 컨텍스트 가져와서 컨텍스트에 인증 객체를 저장한다. 이후 SecurityContextRepository 통해 세션에 컨텍스트를 저장한다.
    - AuthenticationFilter가 이 세션에 컨텍스트 저장 작업해 주지만 커스텀 인증 필터 작업한다면 이 작업은 기본으로 수행되지 않는다. 인증 상태 유지하기 위해서 별도로 이 작업을 수행해줘야 한다.

### 동작
1. **로드(Load)** : 요청이 들어오면 SecurityContextRepository를 통해 저장된 인증 정보(예: 세션의 SecurityContext)가 있는지 확인하고 가져온다.

2. **설정(Set)** : 가져온 정보를 SecurityContextHolder에 넣는다. 이때부터 컨트롤러나 서비스 어디에서든 SecurityContextHolder.getContext()로 사용자 정보를 꺼낼 수 있다.

3. **필터 체인 실행** : 다음 필터와 비즈니스 로직(컨트롤러)을 실행한다.

4. **정리(Clear)** : 요청 처리가 끝나면 SecurityContextHolder를 비운다(Clear). 이는 스레드 풀 환경에서 다른 사용자의 요청이 같은 스레드를 사용할 때 정보가 섞이지 않게 하기 위한 필수 작업이다.

### SecurityContext 생성, 저장, 삭제
1. 익명 사용자
    - SecurityContextRepository 를 사용하여 새로운 SecurityContext 객체를 생성하여 SecurityContextHolder 에 저장 후 다음 필터로 전달
    - AnonymousAuthenticationFilter 에서 AnonymousAuthenticationToken 객체를 SecurityContext 에 저장
2. 인증 요청
    - SecurityContextRepository 를 사용하여 새로운 SecurityContext 객체를 생성하여 SecurityContextHolder 에 저장 후 다음 필터로 전달
    - UsernamePasswordAuthenticationFilter 에서 인증 성공 후 SecurityContext 에 UsernamePasswordAuthentication 객체를 SecurityContext 에 저장
    - **SecurityContextRepository 를 사용하여 HttpSession 에 SecurityContext 를 저장**
3. 인증 후 요청
    - SecurityContextRepository 를 사용하여 **HttpSession 에서 SecurityContext 를 꺼내어** SecurityContextHolder 에서 저장 후 다음 필터로 전달
    - **SecurityContext 안에 Authentication 객체가 존재하면 계속 인증을 유지**한다.
4. 클라이언트 응답 시 공통
    - SecurityContextHolder.clearContext() 로 컨텍스트를 삭제한다. (스레드 풀의 스레드일 경우 반드시 필요)


### SecurityContextHolder & SecurityContextPersistenceFilter
![image](/images/lecture/spring-security-s5-4.png)


### securityContext() API
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	http.securityContext(securityContext -> securityContext
		.requireExplicitSave(true)); // SecurityContext 를 명시적으로 저장할 것이지 아닌지의 여부 설정, 기본값은 true 이다
									// true 이면 SecurityContextHolderFilter, false 이면 SecurityContextPersistanceFilter 가 실행된다
	return http.build();
}
```
- SecurityContextPersistanceFilter 은 Deprecated 되었기 때문에 레거시 시스템 외에는 SecurityContextHolderFilter 를 사용한다.

### CustomAuthenticationFilter & SecurityContextRepository
- 커스텀 인증 필터를 구현할 경우 인증이 완료된 후 SecurityContext 를 SecurityContextHolder 에 설정한 후 securityContextRepository 에 저장하기 위한 코드를 명시적으로 작성해야 한다.
    ```java
    securityContextHolderStrategy.setContext(context);
    securityContextRepository.saveContext(context, request, response);
    ```

- securityContextRepository 는 HttpSessionSecurityContextRepository 혹은 DelegatingSecurityContextRepository 를 사용한다.



::: tip
AuthenticationFilter는 인증 시도 초기에 ID/PW 담은 인증 객체를 생성하고 인증 처리를 맡긴다.
AuthenticationProvider는 최종 인증 성공한 후 다시 인증 객체를 생성하여 필터에 전달하며, 필터는 SecurityContext에 인증 객체를 저장한다.
:::

### 스프링 MVC 인증 구현
- 스프링 시큐리티 필터에 의존하는 대신, 수동으로 사용자를 인증하는 경우 스프링 MVC 컨트롤러 엔드포인트를 사용할 수 있다
- 요청 간에 인증을 저장하고 싶다면 `HttpSessionSecurityContextRepository` 를 사용하여 인증 상태를 저장할 수 있다.

```java
@PostMapping("/login")
public Authentication login(@RequestBody LoginRequest loginRequest, HttpServletRequest request, HttpServletResponse response) {
    UsernamePasswordAuthenticationToken token = UsernamePasswordAuthenticationToken.unauthenticated(
            loginRequest.getUsername(),loginRequest.getPassword());

    // 사용자 이름과 비밀번호를 담은 인증 객체를 생성한다
    Authentication authentication = authenticationManager.authenticate(token);

    // 인증을 시도하고 최종 인증 결과를 반환한다
    SecurityContext securityContext = SecurityContextHolder.getContextHolderStrategy().createEmptyContext();
    securityContext.setAuthentication(authentication); // 인증 결과를 컨텍스트에 저장한다
    SecurityContextHolder.getContextHolderStrategy().setContext(securityContext); // 컨텍스트를 ThreadLocal에 저장한다
    securityContextRepository.saveContext(securityContext, request, response); //컨텍스트를 세션에 저장해서 인증 상태를 영속한다

    return authentication;
}
```

## References

- 스프링 시큐리티 완전 정복 [6.x 개정판] / 인프런 / 정수원