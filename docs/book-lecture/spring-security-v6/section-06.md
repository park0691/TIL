# 세션 관리
## 동시 세션 제어

- 동일한 계정으로 한 명 이상의 사용자가 동시에 접속하거나, 한 사용자가 여러 브라우저에서 중복으로 로그인하는 것을 관리하는 기능 (동일한 계정으로 여러 세션 생성을 관리)
- 사용자의 인증 후에 활성화된 세션의 수가 설정된 `maximumSessions` 값과 비교하여 제어 여부를 결정한다.


### 제어 전략
![image](/images/lecture/spring-security-s6-1.png)

1. 이전 세션 만료
    - 나중에 로그인한 사람을 인정하고, 먼저 로그인해 있던 세션을 무효화한다.
2. 새로운 로그인 차단
    - 이미 최대 세션 수에 도달하면, 추가 로그인을 승인하지 않는다.

### sessionManagement() API

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, HttpSecurity httpSecurity) throws Exception {
    http.authorizeHttpRequests(auth -> auth
                    .requestMatchers("/login").permitAll()
                    .requestMatchers("/customLogin").permitAll()
                    .anyRequest().authenticated())
            .formLogin(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
    ;

    http.sessionManagement(session -> session
                    .invalidSessionUrl("/invalidSessionUrl") // 이미 만료된 세션으로 요청을 하는 사용자를 특정 엔드포인트로 리다이렉션 할 Url 을 지정한다
                    .maximumSessions(1) // 사용자당 최대 세션 수를 제어한다. 기본값은 무제한 세션을 허용한다
                    .maxSessionsPreventsLogin(true) // true 이면 최대 세션 수(maximumSessions(int))에 도달했을 때 사용자의 인증을 방지한다
                                                    // false(기본 설정)이면 인증하는 사용자에게 접근을 허용하고 기존 사용자의 세션은 만료된다
                    .expiredUrl("/expired") // 세션을 만료하고 나서 리다이렉션 할 URL 을 지정한다
    );
```


### 세션 만료 후 리다이렉션 전략
| maxSessionsPreventsLogin() | invalidSessionUrl() | expiredUrl() | 결과 |
| --- | --- | --- | --- |
| false | X | X | This session has been expired |
| false | O | X | This session has been expired |
| false | O | O | invalidSessionUrl()에 설정된 URL로 리다이렉션 |
| false | X | O | expiredUrl()에 설정된 URL로 리다이렉션 |
| true | O, X | O, X | 인증이 차단된다 |

## 세션 고정 보호
- 공격자가 미리 생성해둔 세션 ID를 사용자에게 강제로 심어놓고, 사용자가 그 세션으로 로그인하면 해당 세션을 가로채는 **세션 고정 공격**을 방어하기 위한 보안 메커니즘
- **로그인 전과 후의 세션 ID를 다르게 가져감으로써, 공격자가 미리 알고 있던 세션 ID를 무용지물로 만드는 것**이 핵심이다.

![image](/images/lecture/spring-security-s6-2.png)

### sessionManagement() API

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, HttpSecurity httpSecurity) throws Exception {
    http.sessionManagement(session -> session
                    sessionFixation(sessionFixation -> sessionFixation.newSession())
    );
```

### 전략
- changeSessionId()
    - 기존 세션을 유지하면서 세션 ID만 변경한다. (기본 값)
- newSession()
    - 새로운 세션을 생성하지만, 기존 세션 데이터를 복사하지 않는다. (`SPRING_SECURITY_` 로 시작하는 속성은 복사한다)
- migrateSession()
    - 새로운 세션을 생성하고, 기존 세션의 모든 속성을 새 세션으로 복사한다.
- none()
    - 기존 세션을 그대로 사용한다.
    

## 세션 생성 정책
- 인증된 사용자에 대한 세션 생성 정책을 설정하여 어떻게 세션을 관리할지 결정할 수 있으며 이 정책은 `SessionCreationPolicy`로 설정된다.

### 전략
- `SessionCreationPolicy.ALWAYS`
    - 인증 여부에 상관없이 **항상** 세션을 생성한다.
    - ForceEagerSessionCreationFilter 클래스를 추가 구성하고 세션을 강제로 생성시킨다.
- `SessionCreationPolicy.NEVER`
    - 스프링 시큐리티가 세션을 생성하지 않지만 애플리케이션이 이미 생성한 세션은 사용할 수 있다.
- `SessionCreationPolicy.IF_REQUIRED`
    - 필요한 경우에만 세션을 생성한다. 예를 들어 인증이 필요한 자원에 접근할 때 세션을 생성한다.
- `SessionCreationPolicy.STATELESS`
    - 세션을 **생성하지 않고, 존재해도 사용하지 않는다.**
    - 인증 필터는 인증 완료 후 `SecurityContext`를 세션에 저장하지 않으며 JWT와 같이 세션을 사용하지 않는 방식으로 인증을 관리할 때 유용하다.
    - SecurityContextHolderFilter는 세션 단위가 아닌 요청 단위로 항상 새로운 SecurityContext 객체를 생성하므로 컨텍스트 영속성이 유지되지 않는다.

::: tip STATELESS 설정에도 세션이 생성될 수 있다.
- 스프링 시큐리티에서 CSRF 기능이 활성화 되어 있고 CSRF 기능이 수행 될 경우 사용자의 세션을 생성해서 CSRF 토큰을 저장하게 된다.
- 세션은 생성되지만 CSRF 기능을 위해서 사용될 뿐 인증 프로세스의 SecurityContext 영속성에 영향을 미치지 않는다. 
:::

### sessionManagement() API
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, HttpSecurity httpSecurity) throws Exception {
    http.sessionManagement(session -> session
                    sessionCreationPolicy(SessionCreationPolicy.STATELESS)
    );
```


## SessionManagementFilter
- 주로 **사용자가 인증을 시도할 때 또는 인증된 직후**에 동작한다.
- 요청이 시작된 이후 사용자가 인증되었는지 감지하고, 인증된 경우에는 세션 고정 보호 메커니즘을 활성화하거나 동시 다중 로그인을 확인하는 등 세션 관련 작업을 처리하기 위해 설정된 세션 인증 전략(`SessionAuthenticationStrategy`)을 호출하는 필터 클래스
- 스프링 시큐리티 6 이상에서는 `SessionManagementFilter` 가 기본적으로 설정되지 않으며 세션 관리 API를 설정을 통해 생성할 수 있다.
- 특징
    - 모든 요청마다 동작하기보다는, 주로 인증 이벤트가 발생했을 때 `SessionAuthenticationStrategy`를 호출하여 세션 관련 작업을 처리한다.

### 주요 역할
1. 세션 고정 보호: 인증 성공 후 세션 ID를 새로 발급하여 세션 고정 공격을 방지
2. 세션 생성 정책 제어: 설정된 `SessionCreationPolicy`에 따라 세션을 생성할지 결정
3. 동시 세션 제어: 사용자가 현재 몇 개의 세션을 가지고 있는지 `SessionRegistry`에서 확인하고, 허용 범위를 초과하면 전략(이전 세션 만료 혹은 신규 로그인 차단)을 실행한다.

### 세션 구성 요소
![image](/images/lecture/spring-security-s6-3.png)

## ConcurrentSessionFilter
- 매 요청마다 동작하며, **사용자의 세션이 지금 바로 만료되어야 하는가**를 감시한다.
- 특징
    - 필터 체인의 앞부분에 위치하여, 유효하지 않은 세션이 서버 자원을 더 이상 쓰지 못하도록 빠르게 걸러낸다.

### 주요 역할
1. **만료 여부 확인**: `SessionRegistry`를 뒤져서 현재 요청을 보낸 사용자의 `SessionInformation` 객체를 찾고, 그 안의 `isExpired() 값이 true`인지 (세션이 만료로 표시되었는지) 확인한다.
2. **즉각 처리**: 만약 다른 곳에서 중복 로그인하여 현재 세션이 만료된 상태라면, 즉시 로그아웃 처리를 진행하고, 설정된 `expiredUrl`로 사용자를 쫓아낸다.
3. **마지막 활동 시간 업데이트**: 각 요청에 대해 `SessionRegistry.refreshLastRequest(String)`를 호출하여, **이 세션은 현재 시간까지 활동 중임**을 `SessionRegistry`에 업데이트한다.

### 흐름도
![image](/images/lecture/spring-security-s6-4.png)

### 시퀀스 다이어그램
![image](/images/lecture/spring-security-s6-5.png)

## References

- 스프링 시큐리티 완전 정복 [6.x 개정판] / 인프런 / 정수원