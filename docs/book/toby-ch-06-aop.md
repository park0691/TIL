# CH6. AOP
## 6.1. 트랜잭션 코드의 분리
### 6.1.2. DI를 이용한 클래스의 분리

트랜잭션을 담당하는 코드를 구현 객체에 보이지 않는 것처럼 사라지게 → 트랜잭션 코드를 클래스 밖으로 뽑아내자

### DI 적용하여 트랜잭션 분리
DI : 실제 사용할 오브젝트의 클래스 정체는 감춘 채 인터페이스를 통해 간접 접근하는 것

DI 덕분에 구현 클래스는 얼마든지 외부에서 변경할 수 있다. 런타임에 DI를 통해 적용하는 이유는 <u>구현 클래스를 바꿔가며 사용하기 위함</u>이다.

![image.png](/images/book/toby-ch-06-aop-1.png)

클라이언트 ↔ UserService 관계가 강한 결합도로 고정되어 있다.
⇒ 클라이언트가 의존하는 클래스를 인터페이스로 변경

클라이언트와의 결합이 약해지고, 구현 클래스에 직접 의존하지 않기 때문에 → 유연한 확장 가능

**Q. 한 번에 두 개의 UserService 인터페이스 구현 클래스를 동시에 이용한다면?**

![image.png](/images/book/toby-ch-06-aop-2.png)

`UserServiceTx` 클래스 : 트랜잭션 경계 설정을 담당

→ User 도메인의 비즈니스 로직 전혀 갖지 않고, 다른 UserService 구현 오브젝트에 기능 위임

`UserServiceImpl` 클래스 : 순수하게 비즈니스 로직만 담당

→ User 도메인의 비즈니스 로직에만 충실한 깔끔한 코드

**[트랜잭션이 적용된 UserServiceTx]**

```java
public class UserServiceTx implements UserService {
		UserService userService;
		PlatformTransactionManager transactionManager;
	
		public void setTransactionManager(
				PlatformTransactionManager transactionManager) {
				this.transactionManager = transactionManager;
		}
	
		public void setUserService(UserService userService) {
				this.userService = userService;
		}
	
		public void add(User user) {
				// UserService 오브젝트에 모든 기능을 위임
				this.userService.add(user);
		}
	
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

### 트랜잭션 경계설정 코드 분리의 장점

1. 비즈니스 로직을 담당하는 코드를 작성할 때 트랜잭션과 같은 기술을 전혀 신경 쓸 필요 없다. DI를 이용해 UserServiceTx와 같은 트랜잭션 기능을 가진 오브젝트가 먼저 실행되도록 만들기만 하면 된다.

   스프링이나 트랜잭션 같은 로우레벨의 기술적인 지식이 부족하더라도 비즈니스 로직을 잘 이해하고 자바 언어의 기초에 충실하면 복잡한 비즈니스 로직을 담은 UserService 클래스를 개발할 수 있다.

2. 비즈니스 로직에 대한 테스트를 손쉽게 만들어낼 수 있다.

## 6.2. 고립된 단위 테스트

### 작은 단위의 테스트가 좋은 이유

테스트가 실패했을 때 원인을 찾기 쉽기 때문이다. 오류가 발견됬을 때 양이 많다면 그 원인을 찾기 매우 힘들 수 있다. 또한 테스트 단위가 작아야 테스트 의도나 내용이 분명해지고, 만들기 쉬워진다.

### 6.2.1. 복잡한 의존관계 속의 테스트

UserServiceTest가 테스트하고자 하는 대상인 UserService의 코드가 바르게 작성되어 있으면 성공하고, 아니라면 실패하면 된다. 즉, 테스트 단위는 UserService 클래스이어야 한다.

하지만 테스트 단위인 UserService는 UserDao, TransactionManager, MailSender 세 가지 의존 관계를 갖고 있어, 테스트가 진행되는 동안 같이 실행된다.

UserDao를 구현한 UserDaoJdbc는 DataSource의 구현 클래스와 DB 드라이버, DB 서버까지의 네트워크 통신과 DB서버 자체 그리고 그 안에 정의된 테이블에 의존한다.

UserService를 테스트하는 것처럼 보이지만 그 뒤의 의존 관계를 따라 등장하는 오브젝트와 환경, 서비스, 서버, 심지어 네트워크까지 테스트 대상이 된다.

따라서 이런 경우의 테스트는 준비하기 힘들다. 환경이 조금이라도 달라지면 동일한 테스트 결과를 내지 못할 수도 있으며, 수행 속도는 느리고 테스트의 실행 빈도가 점차 떨어질 것이다.

DB와 함께 동작해야 하는 테스트는 작성하기 힘든 경우도 많다. UserDao에서 사용하는 SQL이 여러 테이블을 조인하고 복잡한 조건을 갖고 있고, 통계 계산을 해서 가져오는 경우, DAO를 위해 복잡한 테스트 데이터를 준비해야 한다. 그런데 막상 UserService를 가져온 목록을 가지고 간단한 계산을 하는게 전부라면, 배보다 배꼽이 더 큰 작업이다.

### 6.2.2. 테스트 대상 오브젝트 고립시키기

UserServiceImpl에 대한 테스트가 진행될 때 사전 테스트를 위해 준비된 동작만 하도록 만든 두 개의 목 오브젝트에만 의존하는, 완벽하게 고립된 테스트 대상으로 만들 수 있다.

![image.png](/images/book/toby-ch-06-aop-3.png)

UserService의 `upgradeLevels()` 메소드를 실행시킨 후에 UserDao를 이용해 DB에 들어간 결과를 가져와 검증하는 방법을 사용했다. 그런데 의존 오브젝트나 외부 서비스에 의존하지 않는 고립된 테스트 방식으로 만든 <u>UserServiceImpl은 그 결과가 DB 등을 통해 남지 않으므로 작업 결과를 검증하기 힘들다</u>.

그리서 테스트 대상인 UserServiceImpl과 그 협력 오브젝트인 UserDao에 어떤 요청을 했는지 확인하는 작업이 필요하다. 테스트 중에 DB에 결과가 반영되지 않았지만, UserDao.update() 메소드를 호출하는 것을 확인할 수 있다면, 결국 DB에 그 결과가 반영되었다 결론 내릴 수 있기 때문이다. UserDao와 같은 역할을 하면서 UserServiceImpl과의 사이에서 주고받은 정보를 저장해뒀다가, 테스트의 검증에 사용할 수 있는 `목 오브젝트`를 만들 필요가 있다.

```java
static class MockUserDao implements UserDao { 
		private List<User> users;  // 레벨 업그레이드 후보 User 오브젝트 목록
		private List<User> updated = new ArrayList(); // 업그레이드 대상 오브젝트
		
		private MockUserDao(List<User> users) {
				this.users = users;
		}
	
		public List<User> getUpdated() {
				return this.updated;
		}
		// 스텁 기능 제공
		public List<User> getAll() {  
				return this.users;
		}
		// 목 오브젝트 기능 제공
		// 넘겨준 업데이트 대상 user 오브젝트를 저장해뒀다가 검증을 위해 돌려주기 위한 것
		public void update(User user) {  
				updated.add(user);
		}
		
		public void add(User user) { throw new UnsupportedOperationException(); }
		public void deleteAll() { throw new UnsupportedOperationException(); }
		public User get(String id) { throw new UnsupportedOperationException(); }
		public int getCount() { throw new UnsupportedOperationException(); }
}
```

### 테스트 수행 성능의 향상
고립된 테스트를 하면 테스트가 다른 의존 대상에 영향 받을 경우를 대비해 복잡하게 준비할 필요가 없을 뿐만 아니라, 테스트 수행 성능도 크게 향상된다. 테스트가 빨라지면 부담 없이 테스트를 자주 돌려볼 수 있다.

### 6.2.3. 단위 테스트와 통합 테스트
단위 테스트는 정하기 나름. 하나의 단위에 초점을 맞춘 테스트다.

→ 사용자 관리 기능 전체를 하나의 단위.
→ 하나의 클래스나 하나의 메소드를 단위로 볼 수도.

본 책에서 정의하는 `단위 테스트` : 테스트 대상 클래스를 목 오브젝트 등의 테스트 대역을 이용해 의존 오브젝트나 외부의 리소스를 사용하지 않도록 고립시켜 테스트하는 것

`통합 테스트` : 두 개 이상의 성격이나 계층이 다른 오브젝트가 연동하도록 만들어 테스트하거나, 또는 외부의 DB나 파일, 서비스 등의 리소스가 참여하는 테스트 → 두 개 이상의 단위가 결합해 동작하면서 테스트가 수행되는 것

424page …

### 6.2.4. 목 프레임워크
단위 테스트를 만들기 위해서는 스텁, 목 오브젝트의 사용이 필수다. 의존 관계가 없는 단순 클래스나 세부 로직을 검증하기 위해서는 메소드 단위로 테스트할 때가 아니라면 대부분 의존 오브젝트를 필요로 하는 코드를 테스트하게 되기 때문이다.

### Mockito 프레임워크
사용하기 편리하고 직관적인 코드로 최근 많은 인기를 끌고 있다. 목 프레임워크의 특징은 목 클래스를 일일히 준비할 필요가 없다는 점이다. 간단한 메소드 호출만으로 다이나믹하게 특정 인터페이스를 구현한 테스트용 목 오브젝트를 만들 수 있다.

- mock() : 목 오브젝트를 생성하기 위한 메소드

```java
UserDao mockUserDao = mock(UserDao.class);
```

이렇게 만들어진 목 오브젝트는 아무런 기능이 없다.

- when() : 생성된 목 오브젝트에 동작을 추가한다.

```java
when(mockUserDao.getAll()).thenReturn(this.users);
```

- verify() : 특정 동작이 수행됬는지 검증한다.

```java
verify(mockUserDao, times(2)).update(any(User.class));
```

User 타입의 오브젝트를 파라미터로 받아 update() 메소드가 두 번 호출됬는지 확인하라는 의미다.

Mockito 목 오브젝트는 다음의 네 단계를 거쳐서 사용하면 된다. 두 번째와 네 번째는 각각 필요한 경우에만 사용할 수 있다.

- 인터페이스를 이용해 목 오브젝트를 만든다.
- 목 오브젝트가 리턴할 값이 있으면 이를 지정한다. 메소드가 호출되면 예외를 강제로 던지게 할 수도 있다.
- 테스트 대상 오브젝트에 DI 해서 목 오브젝트가 테스트 중에 사용되도록 만든다.
- 테스트 대상 오브젝트를 사용한 후에 목 오브젝트의 특정 메소드가 호출됬는지, 어떤 값을 가지고 몇 번 호출됬는지를 검증한다.

**[Mockito를 적용한 테스트 코드]**

```java
@Test
public void mockUpgradeLevels() throws Exception {
		UserServiceImpl userServiceImpl = new UserServiceImpl();
		// 목 오브젝트 생성과, 메소드의 리턴값 설정, DI
		UserDao mockUserDao = mock(UserDao.class);	    
		when(mockUserDao.getAll()).thenReturn(this.users);
		userServiceImpl.setUserDao(mockUserDao);
	
		// 리턴 값이 없는 목 오브젝트 생성
		MailSender mockMailSender = mock(MailSender.class);  
		userServiceImpl.setMailSender(mockMailSender);
	
		userServiceImpl.upgradeLevels();
	
		// 목 오브젝트가 검증하는 검증 기능
		// 메소드가 몇 번 호출됬는지, 파라미터는 무엇인지 확인
		verify(mockUserDao, times(2)).update(any(User.class));				  
		verify(mockUserDao, times(2)).update(any(User.class));
		verify(mockUserDao).update(users.get(1));
		assertThat(users.get(1).getLevel(), is(Level.SILVER));
		verify(mockUserDao).update(users.get(3));
		assertThat(users.get(3).getLevel(), is(Level.GOLD));
	
		ArgumentCaptor<SimpleMailMessage> mailMessageArg = ArgumentCaptor.forClass(SimpleMailMessage.class);
		// 파라미터를 정밀하게 검사하기 위해 캡쳐
		verify(mockMailSender, times(2)).send(mailMessageArg.capture());
		List<SimpleMailMessage> mailMessages = mailMessageArg.getAllValues();
		assertThat(mailMessages.get(0).getTo()[0], is(users.get(1).getEmail()));
		assertThat(mailMessages.get(1).getTo()[0], is(users.get(3).getEmail()));
}	
```

## 6.3. 다이나믹 프록시와 팩토리 빈

### 6.3.1. 프록시와 프록시 패턴, 데코레이터 패턴

트랜잭션 기능은 사용자 관리 비즈니스 로직과 성격이 다르기 때문에 그 적용 사실 자체를 밖으로 분리할 수 있다. 부가 기능 전부를 핵심 코드가 담긴 클래스에서 독립시킬 수 있다. 이 방법을 이용해 UserServiceTx를 만들었고, UserServiceImpl에는 트랜잭션 코드가 남지 않게 됬다.

![image](/images/book/toby-ch-06-aop-4.png)

부가 기능 외의 나머지 모든 기능은 핵심 기능을 가진 클래스로 위임해줘야 한다. 핵심 기능은 부가 기능을 가진 클래스의 존재를 모른다. 따라서 부가 기능이 핵심 기능을 사용하는 구조가 된다.

문제는 클라이언트가 핵심 기능을 가진 클래스를 직접 사용해버리면 부가 기능이 적용될 기회가 없다. 그래서 <u>부가 기능은 마치 자신이 핵심 기능을 가진 클래스인 것처럼 꾸며서</u> 클라이언트가 자신을 거쳐서 핵심 기능을 사용하도록 만들어야 한다.

클라이언트는 인터페이스를 통해서만 핵심 기능을 사용하게 하고, 부가 기능 자신도 같은 인터페이스를 구현한 뒤에 자신이 그 사이에 끼어들어야 한다. → 그러면 클라이언트는 인터페이스만 보고 사용하기 때문에 자신은 핵심 기능을 가진 클래스를 사용할 것이라 기대하지만 사실은 그림 6-9처럼 부가 기능을 통해 핵심 기능을 이용하게 된다.

![image](/images/book/toby-ch-06-aop-5.png)

이렇게 마치 <u>클라이언트가 사용하려고 하는 실제 대상인 것처럼 위장해서 클라이언트의 요청을 받아주는 것을 대리자, 대리인과 같은 역할을 한다고 해서 프록시(proxy)</u>라 부른다. <u>프록시를 통해 최종적을 요청을 위임받아 처리하는 실제 오브젝트를 타깃(target) 또는 실체(real subject)</u>라 부른다.

[프록시의 사용 목적]

- 클라이언트가 타깃에 접근하는 방법을 제어
- 타깃에 부가 기능을 부여

두 가지 모두 대리 오브젝트라는 개념의 프록시를 두고 사용한다는 점은 동일하지만, 목적에 따라서 디자인 패턴에서는 다른 패턴으로 구분한다.

### 데코레이터 패턴

<u>타깃에 부가적인 기능을 런타임시 다이나믹하게 부여</u>해주기 위해 프록시를 사용하는 패턴이다. 코드상에서는 어떤 방법과 순서로 프록시와 타깃이 연결되어 사용되는지 정해져 있지 않다는 뜻이다.

![image](/images/book/toby-ch-06-aop-6.png)

따라서 데코레이터 패턴에서는 프록시가 꼭 한 개로 제한되지 않으며, 프록시가 직접 타깃을 사용하도록 고정시킬 필요가 없다. 같은 인터페이스를 구현한 타겟과 여러 개의 프록시를 사용할 수 있다. 프록시가 여러 개인 만큼 순서를 정해서 단계적으로 위임하는 구조로 만든다.

***e.g.*** 소스코드를 출력하는 핵심 기능이 있다. 이 클래스에 타깃과 같은 인터페이스를 구현하는 프록시를 만들 수 있다. 소스코드에 라인 넘버를 붙여준다거나, 문법에 따라 색을 변경하거나, 특정 폭으로 소스를 잘라주거나, 페이지를 표시해주는 등의 부가 기능을 프록시로 만들어두고, 그림 6-11과 같이 런타임에 이를 적절한 순서로 조합한다.

UserService 인터페이스를 구현한 UserServiceImpl에 트랜잭션 부가 기능을 제공하는 UserServiceTx를 추가한 것도 데코레이터 패턴을 적용한 것이라 볼 수 있다. 수정자 메소드를 이용해 UserServiceTx에 위임할 타깃인 UserServiceImpl을 주입한 것이다.

### 프록시 패턴

일반적으로 사용하는 프록시라는 용어와 디자인 패턴에서 말하는 프록시 패턴은 구분할 필요가 있다.

- 프록시 : 사용 대상 사이에 대리 역할을 맡은 오브젝트를 두는 방법을 총칭
- 프록시 패턴 : 프록시를 사용하는 방법 중에서 <u>타깃에 대한 접근 방법을 제어</u>하려는 목적을 가진 경우

타깃 오브젝트를 생성하기 복잡하거나 당장 필요하지 않은 경우, 꼭 필요한 시점까지 오브젝트를 생성하지 않는 편이 좋다. 그런데 타깃 오브젝트에 대한 레퍼런스가 미리 필요할 수 있다. 이럴 때 프록시 패턴을 적용한다.

→ 클라이언트에게 타깃의 레퍼런스를 넘길 때 실제 타깃 오브젝트를 만드는 대신 프록시를 넘겨주는 것이다. 그리고 프록시의 메소드를 통해 타깃을 사용하려고 시도하면, 그 때 프록시가 타깃 오브젝트를 생성하고 요청을 위임하는 방식이다.

또는 특별한 상황에서 타깃에 대한 접근 권한을 제어하기 위해 프록시 패턴을 사용할 수 있다.

→ 수정 가능한 오브젝트가 있는데 <u>특정 레이어로 넘어가서는 읽기 전용으로만 동작하게 강제</u>해야 한다고 가정하자. 이럴 때 오브젝트의 프록시를 만들어서 사용할 수 있다. 프록시의 특정 메소드를 사용하려고 하면 접근이 불가능하다고 예외를 발생시키면 된다.

**`Collections.unmodifiableCollection()`** 메소드를 통해 만들어지는 오브젝트가 전형적인 접근 권한 제어용 프록시라고 볼 수 있다.

### 6.3.2. 다이나믹 프록시

많은 개발자는 타깃 코드를 직접 고치고 말지 번거롭게 프록시를 만들지는 않겠다고 생각한다. 왜냐하면 프록시를 만드는 일이 상당히 번거롭게 느껴지기 때문이다.

자바에는 `java.lang.reflect` 패키지 안에 프록시를 손쉽게 만들 수 있도록 지원해주는 클래스들이 있다. 프록시 클래스를 일일이 정의하지 않고도 몇 가지 API를 이용해 프록시처럼 동작하는 오브젝트를 다이나믹하게 생성할 수 있다.

### 프록시의 구성과 프록시 작성의 문제점

- 타깃의 인터페이스를 구현하고 위임하는 코드를 작성하기 번거롭다. 부가 기능이 필요 없는 메소드도 구현해서 타깃으로 위임하는 코드를 일일이 만들어줘야 한다.
- 부가기능 코드가 중복될 가능성이 많다. 트랜잭션은 DB를 사용하는 대부분의 로직에 적용될 필요가 있다. 메소드가 많아지고 트랜잭션의 적용 비욜이 높아지면 트랜잭션 기능을 제공하는 유사한 코드가 여러 메소드에 중복되어 나타날 것이다.

이런 문제를 해결하는 데 유용한 것이 바로 JDK의 다이나믹 프록시다.

### 리플렉션

다이나믹 프록시는 리플렉션 기능을 이용해서 프록시를 만들어준다. 리플렉션은 자바의 코드 자체를 추상화해서 접근하도록 만든 것이다.

자바의 모든 클래스는 그 클래스 자체의 구성정보를 담은 Class 타입의 오브젝트를 하나씩 갖고 있다. 클래스 오브젝트를 이용하면 클래스 코드에 대한 메타 정보를 가져오거나 오브젝트를 조작할 수 있다.

invoke() 메소드는 메소드를 실행시킬 대상 오브젝트와 파라미터 목록을 받아서 메소드를 호출한 뒤에 그 결과를 Object 타입으로 돌려준다.

```java
int length = lengthMethod.invoke(name);
```

### 프록시 클래스

- Hello 인터페이스

```java
public interface Hello {
    String sayHello(String name);
    String sayHi(String name);
    String sayThankYou(String name);
}
```

- Target 클래스

```java
public class HelloTarget implements Hello {
    @Override
    public String sayHello(String name) {
        return "Hello " + name;
    }

    @Override
    public String sayHi(String name) {
        return "Hi " + name;
    }

    @Override
    public String sayThankYou(String name) {
        return "Thank you " + name;
    }
}
```

- 프록시 클래스

```java
public class HelloUppercase implements Hello {
    // 위임할 타깃 오브젝트
    Hello hello;

    public HelloUppercase(Hello hello) {
        this.hello = hello;
    }

    @Override
    public String sayHello(String name) {
        return hello.sayHello(name).toUpperCase();
    }

    @Override
    public String sayHi(String name) {
        return hello.sayHi(name).toUpperCase();
    }

    @Override
    public String sayThankYou(String name) {
        return hello.sayThankYou(name).toUpperCase();
    }
}
```

데코레이터 패턴을 적용해서 HelloTarget에 부가 기능을 추가한다. 추가할 기능은 리턴하는 문자를 모두 대문자로 바꿔주는 것이다.

Hello 인터페이스 구현 메소드에서는 타깃 오브젝트의 메소드를 호출한 뒤 결과를 대문자로 바꿔주는 부가 기능을 적용하고 리턴한다. 위임과 기능 부가라는 두 가지 프록시 기능을 모두 처리하는 전형적인 프록시 클래스다.

[문제점]

- 인터페이스의 모든 메소드를 구현해 위임하도록 코드를 만들어야 하며
- 부가 기능인 리턴 값을 대문자로 바꾸는 기능이 모든 메소드에 중복되서 나타난다.

### 다이나믹 프록시 적용

![image](/images/book/toby-ch-06-aop-7.png)

다이나믹 프록시는 <u>프록시 팩토리에 의해 런타임에 다이나믹하게 생성되는 오브젝트</u>다. 다이나믹 프록시 오브젝트는 타깃의 인터페이스와 같은 타입으로 만들어진다.

프록시 팩토리에게 인터페이스 정보만 제공해주면 <u>해당 인터페이스를 구현한 클래스의 오브젝트를 자동으로 만들어주기 때문</u>에 프록시를 만들 때 인터페이스를 모두 구현해가면서 클래스를 정의하는 수고를 덜 수 있다.

프록시로서 필요한 부가 기능 제공 코드는 **`*java.lang.reflect.InvocationHandler*`**를 구현한 오브젝트에 담는다.

`invoke()` 메소드는 리플렉션의 메소드 인터페이스를 파라미터로 받는다.

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

public class UppercaseHandler implements InvocationHandler {
		// 다이나믹 프록시로부터 전달받은 요청을 다시 타깃 오브젝트에 위임해야 하기 때문에
		// 타깃 오브젝트를 주입 받는다.
    Hello target;

    public UppercaseHandler(Hello target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
		    // 타깃으로 위임. 인터페이스의 메소드 호출에 모두 적용된다.
        String ret = (String) method.invoke(target, args);
        // 부가 기능 제공
        return ret.toUpperCase();
    }
}
```

다이나믹 프록시는 `java.lang.reflect.Proxy` 클래스를 사용하여 인터페이스 기반의 프록시 객체를 동적으로 생성한다.

다음은 다이나믹 프록시를 생성하는 코드다.

```java
Hello proxiedHello = (Hello) Proxy.newProxyInstance(
								// 동적으로 생성되는 다이나믹 프록시 클래스 로딩에 사용할 클래스 로더
                getClass().getClassLoader(),
                // 구현할 인터페이스
                new Class[] { Hello.class },
                // 부가 기능과 위임 코드를 담은 InvocationHandler
                new UppercaseHandler(new HelloTarget())
        );
```

### 다이나믹 프록시의 확장

UppercaseHandler는 모든 메소드의 리턴 타입이 스트링이라고 가정했다. 그런데 스트링 외의 리턴 타입을 갖는 메소드가 추가되면 어떨까? 런타임 시에 캐스팅 오류가 발생할 것이다.

Method를 이용한 타깃 오브젝트의 메소드 호출 후 리턴 타입을 확인해서 스트링인 경우만 대문자로 바꿔주고, 나머지는 그대로 넘겨주는 방식으로 수정하는 것이 좋겠다.

InvocationHandler 방식의 또 한 가지 장점은 타깃 종류에 상관 없이 적용 가능하다는 점이다. 리플렉션의 Method 인터페이스를 이용해 타깃 메소드를 호출하므로 Hello 타입의 타깃으로 제한할 필요도 없다.

어떤 종류의 인터페이스를 구현한 타깃이든 상관없이 재사용할 수 있고, 메소드 리턴 타입이 스트링인 경우만 대문자로 바꿔주도록 UppercaseHandler를 만들 수 있다.

```java
public class UppercaseHandler implements InvocationHandler {
    // 어떤 종류의 인터페이스를 구현한 타깃에도 적용 가능하도록 Object 타입으로 수정
    Object target;

    public UppercaseHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Object ret = method.invoke(target, args);
        if (ret instanceof String && method.getName().startsWith("say")) {
            return((String) ret).toUpperCase();
        } else {
            return ret;
        }
    }
}
```

### 6.3.3. 다이나믹 프록시를 이용한 트랜잭션 부가기능

UserServiceTx는 서비스 인터페이스의 모든 메소드를 구현해야 하고, 트랜잭션이 필요한 메소드마다 트랜잭션 처리 코드가 중복되어 비효율적이다.

- 트랜잭션 부가 기능을 가진 TransactionHandler

```java
public class TransactionHandler implements InvocationHandler {
    Object target;
    PlatformTransactionManager transactionManager;
    String pattern;

    public void setTarget(Object target) {
        this.target = target;
    }

    public void setTransactionManager(
            PlatformTransactionManager transactionManager) {
        this.transactionManager = transactionManager;
    }

    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
		    // 트랜잭션 적용 대상 메소드를 선별해서 트랜잭션 경계설정 기능을 부여한다.
        if (method.getName().startsWith(pattern)) {
            return invokeInTransaction(method, args);
        } else {
            return method.invoke(target, args);
        }
    }

    private Object invokeInTransaction(Method method, Object[] args) throws Throwable {
        TransactionStatus status = this.transactionManager
                .getTransaction(new DefaultTransactionDefinition());
        try {
            Object ret = method.invoke(target, args);
            this.transactionManager.commit(status);
            return ret;
        } catch (InvocationTargetException e) {
            this.transactionManager.rollback(status);
            throw e.getTargetException();
        }
    }
}
```

### 6.3.4. 다이나믹 프록시를 위한 팩토리 빈

DI의 대상이 되는 다이나믹 프록시 오브젝트는 일반적인 스프링 빈으로는 등록할 방법이 없다. `Proxy.newProxyInstance()` 스태틱 팩토리 메소드를 통해서만 만들 수 있다.

### 팩토리 빈

스프링을 대신해서 오브젝트의 생성 로직을 담당하도록 만들어진 특별한 빈을 말한다.

팩토리 빈은 스프링의 FactoryBean 인터페이스를 구현하는 것이다.

```java
import org.springframework.beans.factory.FactoryBean;

public interface FactoryBean<T> {
		// 빈 오브젝트를 생성해서 돌려준다.
		T getObject() throws Exception;
		// 생성되는 오브젝트의 타입을 알려준다.
		Class<?> getObjectType();
		// getObject()가 돌려주는 오브젝트가 싱글톤인지 알려준다.
		default boolean isSingleton() { return true; }
}
```

- 빈 오브젝트로 만들어 사용할 Message 클래스

```java
public class Message {
    String text;
    
    private Message(String text) {
        this.text = text;
    }
    
    public String getText() {
        return text;
    }
    
    public static Message newMessage(String text) {
        return new Message(text);
    }
}
```

오브젝트를 만들려면 반드시 스태틱 메소드를 사용하도록 했다. 따라서 이 클래스를 직접 스프링 빈으로 등록해서 사용할 수 없다.

- 팩토리 빈 클래스

```java
public class MessageFactoryBean implements FactoryBean {
    String text;
    
    // 오브젝트를 생성할 때 필요한 정보를 팩토리 빈의 프로퍼티로 설정해서
    // 대신 DI 받을 수 있게 한다. 주입된 정보는 오브젝트 생성 중 사용된다.
    public void setText(String text) {
        this.text = text;
    }

    // 실제 빈으로 사용될 오브젝트를 생성한다.
    // 코드를 이용하기 때문에 복잡한 방식의 오브젝트도 생성, 초기화 가능하다.
    @Override
    public Object getObject() throws Exception {
        return null;
    }

    @Override
    public Class<?> getObjectType() {
        return null;
    }

    // 팩토리 빈은 매번 요청할 때마다 새로운 오브젝트를 만들므로 false로 설정
    @Override
    public boolean isSingleton() {
        return false;
    }
}
```

- 팩토리 빈 테스트

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration
public class FactoryBeanTest {
		@Autowired
		ApplicationContext context;
		
		@Test
		public void getMessageFromFactoryBean() {
				Object message = context.getBean("message");
				assertThat(message, is(Message.class));
				assertThat(((Message)message).getText(), is("Factory Bean"));
		}
		
		@Test
		public void getFactoryBean() throws Exception {
				Object factory = context.getBean("&message");
				assertThat(factory, is(MessageFactoryBean.class));
		}
}
```

스프링은 ‘&’를 빈 이름 앞에 붙여주면 팩토리 빈 자체를 돌려준다.

### 다이나믹 프록시를 만들어주는 팩토리 빈

팩토리 빈의 getObject() 메소드에 다이나믹 프록시 오브젝트를 만들어주는 코드를 넣는다.

```java
public class TxProxyFactoryBean implements FactoryBean<Object> {
    Object target;
    PlatformTransactionManager transactionManager;
    String pattern;
    Class<?> serviceInterface;

    public void setTarget(Object target) {
        this.target = target;
    }

    public void setTransactionManager(PlatformTransactionManager transactionManager) {
        this.transactionManager = transactionManager;
    }

    public void setPattern(String pattern) {
        this.pattern = pattern;
    }

    public void setServiceInterface(Class<?> serviceInterface) {
        this.serviceInterface = serviceInterface;
    }

    // FactoryBean 인터페이스 구현 메소드 (다이나믹 프록시 생성)
    public Object getObject() throws Exception {
        TransactionHandler txHandler = new TransactionHandler();
        txHandler.setTarget(target);
        txHandler.setTransactionManager(transactionManager);
        txHandler.setPattern(pattern);
        return Proxy.newProxyInstance(
                getClass().getClassLoader(),new Class[] { serviceInterface }, txHandler);
    }

    public Class<?> getObjectType() {
        return serviceInterface;
    }

    public boolean isSingleton() {
        return false;
    }
}
```

### 6.3.5. 프록시 팩토리 빈 방식의 장점과 한계

### 프록시 팩토리 빈의 재사용

TxFactoryBean 코드의 수정 없이 다양한 클래스에 적용할 수 있다. 타깃 오브젝트에 맞는 프로퍼티 정보를 설정해서 빈으로 등록해주기만 하면 된다. 하나 이상의 TxProxyFactoryBean을 동시에 빈으로 등록해도 상관없다. 팩토리 빈이기 때문에 <u>각 빈의 타입은 타깃 인터페이스와 일치</u>한다.

![image](/images/book/toby-ch-06-aop-8.png)

데코레이터 패턴이 적용된 프록시의 문제점

- 프록시를 적용할 대상이 구현하고 있는 인터페이스를 구현하는 프록시 클래스를 일일히 만들어야 하는 번거로움

- 부가 기능이 여러 메소드에 반복적으로 나타나게 되어 코드 중복의 문제

  ⇒ 다이나믹 프록시를 이용하면 타깃 인터페이스를 구현하는 클래스를 일일히 구현하지 않아도 된다.

  ⇒ 하나의 핸들러 메소드를 구현하는 것만으로 수많은 메소드에 부가기능을 부여할 수 있어 코드의 중복 문제도 사라진다.

  ⇒ 프록시에 팩토리 빈을 이용한 DI 까지 더해주면 번거로운 다이나믹 프록시 생성 코드도 제거할 수 있다.

### 한계

한 클래스 안에 존재하는 여러 개의 메소드에 부가 기능을 한 번에 제공하는 건 어렵지 않게 가능했다. 하지만 한 번에 여러 개의 클래스에 공통적인 부가 기능을 제공하는 일은 지금까지의 방법으로 불가능하다.

트랜잭션과 같이 같은 <u>비즈니스 로직을 담은 많은 클래스의 메소드에 적용할 필요가 있다면</u> 거의 비슷한 프록시 팩토리 빈의 설정이 중복된다.

```java
return Proxy.newProxyInstance(
      getClass().getClassLoader(),new Class[] { AInterface }, txHandler);
      
return Proxy.newProxyInstance(
      getClass().getClassLoader(),new Class[] { BInterface }, txHandler);
```

하나의 타깃에 여러 개의 부가기능을 적용하려고 할 때, 같은 타깃 오브젝트에 대해 트랜잭션 프록시 뿐 아니라 보안, 로그 등의 다양한 부가 기능을 담은 프록시도 추가하고 싶다면 인터페이스만 다른 거의 비슷한 설정이 반복될 것이다.

또한 TransactionHandler 오브젝트가 프록시 팩토리 빈 개수만큼 만들어진다는 점이다.

타깃 오브젝트를 프로퍼티로 갖고 있어 트랜잭션 부가 기능을 제공하는 동일한 코드임에도 불구하고 타깃 오브젝트가 달라지면 TransactionHandler 오브젝트를 새로 만들어야 한다. TransactionHandler 오브젝트는 굳이 팩토리 빈에서 만들지 않아도 된다.

## 6.4. 스프링의 프록시 팩토리 빈

### 6.4.1. ProxyFactoryBean

프록시를 생성해서 빈 오브젝트로 등록하게 해주는 팩토리 빈이다. 기존 TxFactoryBean과 달리 순수하게 프록시를 생성하는 작업만 담당하고, 프록시를 통해 제공할 부가 기능은 별도의 빈에 둘 수 있다.

ProxyFactoryBean이 생성하는 프록시에서 사용할 부가기능은 MethodInterceptor 인터페이스를 구현해서 만든다. MethodInterceptor는 InvocationHandler와 비슷하지만 한 가지 다른 점이 있다.

- InvocationHandler의 `invoke()` 메소드 : Target 오브젝트에 대한 정보를 제공하지 않는다. 따라서 타깃은 InvocationHandler를 구현한 클래스가 직접 알고 있어야 한다.
- MethodInterceptor의 `invoke()` 메소드 : ProxyFactoryBean으로부터 타깃 오브젝트에 대한 정보까지 함께 제공받는다.

그 차이 덕분에 <u>MethodInterceptor는 타깃 오브젝트에 상관없이 독립적으로 만들어질 수 있다</u>. 따라서 MethodInterceptor 오브젝트는 <u>타깃이 다른 여러 프록시에서 함께 사용할 수 있고, 싱글톤 빈으로 등록 가능</u>하다.

```java
public void simpleProxy() {
		// JDK 다아내믹 프록시 생성
    Hello proxiedHello = (Hello)Proxy.newProxyInstance(
        getClass().getClassLoader(),
        new Class[] {Hello.class},
        new UppercaseHandler(new HelloTarget())
    );
}

public void proxyFactoryBean() {
    ProxyFactoryBean pfBean = new ProxyFactoryBean();
    // 타깃 설정
    pfBean.setTarget(new HelloTarget());
    // 부가 기능을 담은 어드바이스를 추가한다. 여러 개를 추가할 수도 있다.
    pfBean.addAdvice(new UppercaseAdvice());

		// FactoryBean이므로 getObject()로 생성된 프록시를 가져온다.
    Hello proxiedHello = (Hello) pfBean.getObject();    
    System.out.println(proxiedHello.sayHello("Toby"));
    System.out.println(proxiedHello.sayHi("Toby"));
    System.out.println(proxiedHello.sayThankYou("Toby"));
}

static class UppercaseAdvice implements MethodInterceptor {

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        /*
            리플렉션의 Method와 달리 MethodInvocation은 
            메소드 정보와 함께 타깃 오브젝트를 알고 있기 때문에
            메소드 실행 시 타깃 오브젝트를 전달할 필요가 없다.
        */
        String ret = (String) invocation.proceed();
        return ret.toUpperCase();   //  부가기능 적용
    }
}

// 타깃과 프록시가 구현할 인터페이스
public interface Hello {
    String sayHello(String name);
    String sayHi(String name);
    String sayThankYou(String name);
}

// 타깃 클래스
static class HelloTarget implements Hello {

    @Override
    public String sayHello(String name) { return "Hello " + name;}

    @Override
    public String sayHi(String name) { return "Hi " + name;}

    @Override
    public String sayThankYou(String name) {return "Thank You " + name;}
}
```

### 어드바이스: 타깃이 필요 없는 순수한 부가 기능

MethodInterceptor를 구현한 UppercaseAdvice에는 타깃 오브젝트가 없다. MethodInterceptor로는 메소드 정보와 함께 타깃 오브젝트가 담긴 MethodInvocation 오브젝트가 전달된다. MethodInvocation은 타깃 오브젝트의 메소드를 실행할 수 있기 때문에, MethodInterceptor는 <u>부가 기능을 제공하는 데만 집중</u>할 수 있다.

ProxyFactoryBean에 addAdvice() 메소드를 통해 여러 개의 MethodInterceptor를 추가할 수 있다. ProxyFactoryBean 하나만으로 여러 개의 부가 기능을 제공하는 프록시를 만들 수 있다.

MethodInterceptor는 <u>Advice 인터페이스를 상속하고 있는 서브 인터페이스</u>다.

MethodInterceptor처럼 <u>타깃 오브젝트에 적용하는 부가 기능을 담은 오브젝트</u>를 스프링에서는 어드바이스(Advice) 라고 부른다.

### 포인트컷: 부가기능 적용 대상 메소드 선정 방법

MethodInterceptor 오브젝트는 여러 프록시가 공유해서 사용할 수 있으므로 타깃 정보를 갖지 않도록 만들었다. 트랜잭션 적용 메소드 패턴은 프록시마다 다를 수 있기 때문에 특정 프록시에만 적용되는 패턴을 넣으면 문제가 된다.

MethodInterceptor에는 재사용 가능한 순수 부가 기능 제공 코드만 넣는다. 대신 프록시에 부가기능 적용 메소드를 선택하는 기능을 넣자.

![image](/images/book/toby-ch-06-aop-9.png)

스프링은 부가기능을 제공하는 오브젝트를 Advice라고 부르고, <u>메소드 선정 알고리즘을 담은 오브젝트를 PointCut</u> 라고 부른다.

프록시는 클라이언트로부터 요청 받으면 먼저 포인트컷에게 부가기능을 부여할 메소드인지 확인해달라고 요청한다. 프록시는 포인트컷으로부터 부가기능을 적용할 메소드로 확인 받으면 MethodInterceptor 타입의 어드바이스를 호출한다.

- 포인트컷까지 적용한 ***ProxyFactoryBean***

```java
@Test
public void pointcutAdvisor() {
		ProxyFactoryBean pfBean = new ProxyFactoryBean();
		pfBean.setTarget(new HelloTarget());
		
		// 메소드 이름을 비교해서 대상을 선정하는 알고리즘을 제공하는 포인트컷
		NameMatchMethodPointcut pointcut = new NameMatchMethodPointcut();
		pointcut.setMappedName("sayH*"); 
		
		pfBean.addAdvisor(new DefaultPointcutAdvisor(pointcut, new UppercaseAdvice()));
		
		Hello proxiedHello = (Hello) pfBean.getObject();
		
		assertThat(proxiedHello.sayHello("Toby"), is("HELLO TOBY"));
		assertThat(proxiedHello.sayHi("Toby"), is("HI TOBY"));
		assertThat(proxiedHello.sayThankYou("Toby"), is("Thank You Toby")); 
}
```

포인트컷을 함께 등록할 때 <u>어드바이스와 포인트컷을 Advisor 타입으로 묶어서 `addAdvice()` 메소드를 호출</u>해야 한다.

왜 묶어서 등록해야 할까? ProxyFactoryBean은 여러 개의 어드바이스와 포인트컷이 추가될 수 있기 때문이다. 어드바이스와 포인트컷을 따로 등록하면 어떤 어드바이스(부가기능)에 대해 어떤 포인트컷을 적용할지 애매해지기 때문이다.

어드바이스와 포인트컷을 묶은 오브젝트를 인터페이스 이름을 따서 ‘어드바이저’ 라고 부른다.

## 6.5. 스프링 AOP

### 6.5.1. 자동 프록시 생성

프록시 팩토리 빈 방식의 접근 방법 한계로 생각했던 두 가지 문제 중 하나인 부가기능이 타깃 오브젝트마다 새로 만들어지는 문제는 스프링 ProxyFactoryBean의 Advice를 통해 해결했다.

남은 것은 <u>부가 기능의 적용이 필요한 타깃 오브젝트마다 거의 비슷한 내용의 ProxyFactoryBean 빈 설정 정보를 추가하는 부분</u>이다. 새로운 타깃이 등장했다 해서 코드를 손댈 필요는 없어졌지만 설정은 매번 복사해서 붙이고 target 프로퍼티의 내용을 수정해줘야 한다.

target 프로퍼티를 제외하면 빈 클래스의 종류, 어드바이스, 포인트컷의 설정이 동일하다. 이런 류의 중복은 제거할 방법이 없을까?

- ProxyFactoryBean 설정 xml

```xml
<bean id="userService" class="org.springframework.aop.framework.ProxyFactoryBean">
	<property name="target" ref="userServicelmpl" />
	<property name="interceptorNames">
		<list>
			<value>transactionAdvisor</value>
		</list>
	</property>
</bean>
```

### 중복 문제의 접근 방법

타깃 오브젝트로의 위임과 부가 기능 적용을 위한 코드가 프록시가 구현해야 하는 모든 인터페이스의 메소드마다 반복적으로 필요했다. 이를 다이나믹 프록시라는 런타임 코드 자동 생성 기법을 이용하여 해결했다. JDK 다이나믹 프록시는 <u>특정 인터페이스를 구현한 오브젝트에 대해 프록시 역할 클래스를 런타임 시 내부적으로 만들어준다</u>. 그 덕분에 개발자가 일일이 인터페이스 메소드를 구현하는 프록시 클래스를 만들어서 위임, 부가기능의 코드를 중복해서 넣어주지 않아도 되게 해줬다.

변하지 않는 타깃으로의 위임과 부가기능 적용 여부 판단이라는 부분은 코드 생성 기법을 이용하는 다이나믹 프록시 기술에 맡기고, 변하는 부가기능 코드는 별도로 만들어서 다이나믹 프록시 생성 팩토리에 DI로 제공하는 기법을 사용한 것이다.

부가기능 로직인 트랜잭션 경계설정은 코드로 만들게 하고, 기계적인 코드인 타깃 인터페이스 구현과 위임, 부가기능 연동 부분은 자동생성하게 한 것이다.

반복적인 프록시 메소드의 구현을 코드 자동생성 기법을 이용해 해결했다면 반복적인 ProxyFactoryBean 설정 문제는 어떻게 해결할까?

마치 다이내믹 프록시가 인터페이스만 제공하면 모든 메소드에 대한 구현 클래스를 자동으로 만들듯이, 일정한 타깃 빈의 목록을 제공하면 자동으로 각 타깃 빈에 대한 프록시를 만들어주는 방법이 있다면 ProxyFactoryBean 타입 빈 설정을 매번 추가해서 프록시를 만들어내는 수고를 덜 수 있을 것같다.

하지만 지금까지 살펴본 방법에서는 한 번에 여러 개의 빈에 프록시를 적용할 만한 방법은 없었다.

### 빈 후처리기를 이용한 자동 프록시 생성기

스프링은 컨테이너로서 제공하는 기능 중 변하지 않는 핵심적인 부분 외에는 대부분 확장할 수 있도록 확장 포인트를 제공해준다.

그 중에서 관심 가질 만한 확장 포인트는 `BeanPostProcessor` 인터페이스를 구현해서 만드는 빈 후처리기다. `빈 후처리기`는 이름 그대로, <u>스프링 빈 오브젝트로 만들어지고 난 후에 빈 오브젝트를 다시 가공</u>해 준다.

스프링이 제공하는 빈 후처리기 중 하나인 `DefaultAdvisorAutoProxyCreator` 는 어드바이저를 이용한 자동 프록시 생성기다.

스프링은 빈 후처리기가 빈으로 등록되어 있으면 <u>빈 오브젝트가 생성될 때마다 빈 후처리기에 보내서 후처리 작업을 요청</u>한다. 빈 후처리기는 빈 오브젝트의 프로퍼티를 강제로 수정할 수도 있고 별도의 초기화 작업을 수행할 수도 있다.

다음 그림은 빈 후처리기를 이용한 자동 프록시 생성 방법을 설명한다.

![image](/images/book/toby-ch-06-aop-10.png)

1. `DefaultAdvisorAutoProxyCreator` 빈 후처리기가 등록되 있으면 스프링은 빈 오브젝트를 만들 때마다 후처리기에게 빈을 보낸다.
2. `DefaultAdvisorAutoProxyCreator` 는 빈으로 등록된 모든 어드바이저 내의 포인트컷을 이용해 전달받은 빈이 프록시 적용 대상인지 확인한다.
3. 프록시 적용 대상이면 내장된 프록시 생성기에게 현재 빈에 대한 프록시를 만들게 하고, 만들어진 프록시에 어드바이저를 연결해 준다.
4. 빈 후처리기는 프록시가 생성되면 원래 컨테이너가 전달해준 빈 오브젝트 대신 프록시 오브젝트를 컨테이너에게 돌려준다.
5. 컨테이너는 최종적으로 빈 후처리기가 돌려준 오브젝트를 빈으로 등록하고 사용한다.

적용할 빈을 선정하는 로직이 추가된 포인트컷이 담긴 어드바이저를 등록하고 빈 후처리기를 사용하면 일일이 `ProxyFactoryBean` 빈을 등록하지 않아도 타깃 오브젝트에 자동으로 프록시가 적용되게 할 수 있다. 이로써 마지막 남은 번거로운 `ProxyFactoryBean` 설정 문제를 해결할 수 있다.

### 확장된 포인트컷

포인트컷이란 타깃 오브젝트의 메소드 중 어떤 메소드에 부가기능을 적용할지 선정해주는 역할을 할 뿐만 아니라, 등록된 빈 중에 어떤 빈에 프록시를 적용할지 선정해주기도 한다.

포인트컷은 클래스 필터와 메소드 매처 두 가지를 돌려주는 메소드를 갖고 있다.

```java
package org.springframework.aop;

public interface PointCut {
		// 프록시를 적용할 클래스인지 확인해준다.
		ClassFilter getClassFilter();
		// 어드바이스를 적용할 메서드인지 확인해준다.
		MethodMatcher getMethodMatcher();
}
```

ProxyFactoryBean에서 포인트컷을 사용할 때는 이미 타깃이 정해져 있기 때문에 포인트컷은 메소드 선별만 필요하고, 굳이 클래스 레벨 필터는 필요 없었다.

포인트컷의 기능을 모두 적용한다면 먼저 프록시를 적용할 클래스인지 판단한 후 적용 대상 클래스인 경우 어드바이스를 적용할 메소드인지 확인하는 방식으로 동작한다. 두 가지 조건이 모두 충족되는 타깃의 메소드에 Advice가 적용된다.

모든 빈에 대해 프록시 자동 적용 대상을 선별해야 하는 빈 후처리기인 `DefaultAdvisorAutoProxyCreator` 는 클래스와 메소드 선정 알고리즘을 모두 갖고 있는 포인트컷이 필요하다.

- 확장 포인트컷 테스트

```java
@Test
public void classNamePointcutAdvisor() {
    NameMatchMethodPointcut classMethodPointcut = new NameMatchMethodPointcut() {
        public ClassFilter getClassFilter() {
            return new ClassFilter() {
                public boolean matches(Class<?> clazz) {
                    return clazz.getSimpleName().startsWith("HelloT");
                }
            };
        }
    };
    classMethodPointcut.setMappedName("sayH*");

		// 적용 대상
    checkAdviced(new HelloTarget(), classMethodPointcut, true);

		// 적용 대상 아님
    class HelloWorld extends HelloTarget {};
    checkAdviced(new HelloWorld(), classMethodPointcut, false);

		// 적용 대상
    class HelloToby extends HelloTarget {};
    checkAdviced(new HelloToby(), classMethodPointcut, true);
}

private void checkAdviced(Object target, Pointcut pointcut, boolean adviced) {
    ProxyFactoryBean pfBean = new ProxyFactoryBean();
    pfBean.setTarget(target);
    pfBean.addAdvisor(new DefaultPointcutAdvisor(pointcut, new UppercaseAdvice()));
    Hello proxiedHello = (Hello) pfBean.getObject();

		// 적용 대상이면
    if (adviced) {
        assertThat(proxiedHello.sayHello("Toby"), is("HELLO TOBY"));
        assertThat(proxiedHello.sayHi("Toby"), is("HI TOBY"));
        assertThat(proxiedHello.sayThankYou("Toby"), is("Thank You Toby"));
    }
    else {
        assertThat(proxiedHello.sayHello("Toby"), is("Hello Toby"));
        assertThat(proxiedHello.sayHi("Toby"), is("Hi Toby"));
        assertThat(proxiedHello.sayThankYou("Toby"), is("Thank You Toby"));
    }
}
```

### 6.5.2. DefaultAdvisorAutoProxyCreator의 적용

### 클래스 필터 적용한 포인트컷 작성

```java
public class NameMatchClassMethodPointcut extends NameMatchMethodPointcut {
    public void setMappedClassName(String mappedClassName) {
		    // 모든 클래스를 다 허용하는 디폴트 클래스 필터를 덮어씌운다.
        this.setClassFilter(new SimpleClassFilter(mappedClassName));
    }

    static class SimpleClassFilter implements ClassFilter {
        String mappedName;

        private SimpleClassFilter(String mappedName) {
            this.mappedName = mappedName;
        }

        public boolean matches(Class<?> clazz) {
            return PatternMatchUtils.simpleMatch(mappedName, clazz.getSimpleName());
        }
    }
}
```

DefaultAdvisorAutoProxyCreator는 등록된 빈 중에서 Advisor 인터페이스를 구현한 것을 모두 찾는다. 그리고 생성되는 모든 빈에 대해 어드바이저의 포인트컷을 적용해보면서 프록시 적용 대상을 선정한다. 빈 클래스가 프록시 선정 대상이라면 프록시를 만들어 원래 빈 오브젝트와 바꿔치기한다.

타깃 빈에 의존한다고 정의한 다른 빈들은 프록시 오브젝트를 대신 DI 받게 될 것이다.

### 어드바이스와 어드바이저

부가 기능을 포함하는 어드바이스를 정의한다.

```java
public class TransactionAdvice implements MethodInterceptor {

    private PlatformTransactionManager transactionManager;

    public void setTransactionManager(PlatformTransactionManager transactionManager){
        this.transactionManager = transactionManager;
    }

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        TransactionStatus status = transactionManager
                .getTransaction(new DefaultTransactionDefinition());

        try {
		        //타겟 메서드 실행
            Object ret = invocation.proceed();
            transactionManager.commit(status);
            return ret;
        } catch (RuntimeException e){
            transactionManager.rollback(status);
            throw e;
        }
    }
}
```

어드바이저는 스프링에서 제공하는 DefaultPointcutAdvisor를 사용한다.

DefaultPointcutAdvisor는 Advisor 인터페이스의 구현체 클래스 중 하나이다.

### XML을 통한 빈 설정

```xml
<!-- 타겟 클래스. UserServiceImpl 메서드 실행 도중 예외 발생 시 모든 트랜잭션을 롤백하기 위해 트랜잭션 부가 기능을 적용한다.-->
<bean id = "userService" class = "org.example.user.service.UserServiceImpl">
    <property name="userDao" ref = "userDao"></property>
    <property name="userLevelUpgradePolicy" ref = "defaultUserLevelUpgradePolicy"></property>
</bean>

...

<!-- 빈 후처리기 등록 -->
<bean class ="org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator"/>

<!-- 어드바이스 설정 -->
<bean id = "transactionAdvice" class = "org.example.proxy.TransactionAdvice">
    <property name="transactionManager" ref = "transactionManager"></property>
</bean>

<!-- 포인트컷 설정 -->
<bean id = "transactionPointcut" class = "org.example.proxy.NameMatchClassMethodPointcut">
    <property name="mappedClassName" value = "*ServiceImpl"/>
    <property name="mappedName" value = "upgrade*"/>
</bean>

<!-- 어드바이저 (어드바이스 + 포인트컷) 설정 -->
<bean id = "transactionAdvisor" class = "org.springframework.aop.support.DefaultPointcutAdvisor">
    <property name="advice" ref = "transactionAdvice"></property>
    <property name="pointcut" ref ="transactionPointcut"></property>
</bean>
```

클래스 이름의 suffix가 ServiceImpl인 클래스, 메서드 이름의 prefix가 upgrade인 메서드에 대해 포인트컷을 설정하였다.

### 테스트

UserService의 upgradeLevels() 메서드를 호출하여 테스트하며 예외 발생 시 트랜잭션이 적용되는지 확인하도록 한다.

### 6.5.3. 포인트컷 표현식을 이용한 포인트컷

SKIP

### 6.5.4. AOP란 무엇인가?

### 트랜잭션 서비스 추상화

트랜잭션 경계설정 코드를 비즈니스 로직에 담으면 → 특정 트랜잭션 기술에 종속된 코드가 된다.

JDBC 로컬 트랜잭션 방식의 코드를 JTA를 이용한 글로벌/분산 트랜잭션 방식으로 바꾸려면 모든 트랜잭션 적용 코드를 수정해야 한다는 심각한 문제

트랜잭션 처리의 구체적인 방법이 변하면 → 트랜잭션과 직접 관련이 없는 코드가 담긴 많은 클래스를 일일히 수정해야 했다.

트랜잭션 적용이라는 <u>추상적인 작업 내용은 유지한 채 구체적인 구현을 자유롭게 바꿀 수 있도록</u> 서비스 추상화 기법을 적용한다. 비즈니스 로직 코드는 트랜잭션을 어떻게 처리해야 한다는 구체적인 방법과 서버 환경에 종속되지 않는 장점이 있다.

구체적인 구현 내용을 담은 의존 오브젝트는 런타임 시에 다이나믹하게 연결해준다는 DI를 활용한 전형적인 접근 방법

트랜잭션 추상화란 결국 <u>인터페이스, DI를 통해 무엇을 하는지를 남기고, 그것을 어떻게 하는지를 분리한 것</u>이다. 어떻게 할지는 더 이상 비즈니스 로직 코드에는 영향을 주지 않고 독립적으로 변경할 수 있게 됬다.

### 프록시와 데코레이터 패턴

트랜잭션을 어떻게 다룰 것인가는 추상화를 통해 코드에서 제거했지만, 여전히 비즈니스 로직 코드에는 트랜잭션 적용 코드가 노출된다. 문제는 대부분의 비즈니스 로직 메소드에 노출된다는 점이다. 트랜잭션 경계설정을 담당하는 코드의 특성 때문에 <u>단순한 추상화, 메소드 추출 방법</u>으로는 더 이상 제거할 방법이 없었다.

그래서 도입한 것이 DI를 이용해 데코레이터 패턴을 적용하는 방법이다. 클라이언트가 인터페이스와 DI를 통해 접근하도록 설계하고, 데코레이터 패턴을 적용해서 비즈니스 로직을 담은 클래스의 코드에는 전혀 영향을 주지 않으면서 트랜잭션 부가 기능을 자유롭게 부여할 수 있는 구조를 만들었다.

트랜잭션 처리 코드는 일종의 데코레이터에 담겨서 클라이언트와 비즈니스 로직을 담은 타깃 클래스 사이에 존재한다. 그래서 클라이언트가 일종의 대리자인 프록시 역할을 하는 트랜잭션 데코레이터를 거쳐 타깃에 접근할 수 있게 되었다.

따라서, 비즈니스 로직 코드는 (트랜잭션과 같은) <u>성격이 다른 코드로부터 자유로워졌고, 독립적으로 로직을 검증하는 고립된 단위 테스트를 만들 수 있게 되었다</u>.

### 다이나믹 프록시와 프록시 팩토리 빈

비즈니스 로직 인터페이스의 모든 메소드마다 트랜잭션 기능을 부여하는 코드를 넣어 프록시 클래스를 만드는 작업이 오히려 큰 짐이 됬다.

그래서 프록시 클래스 없이도 프록시 오브젝트를 런타임에 만들어주는 JDK 다이나믹 프록시 기술을 적용했다. 그 덕분에 프록시 클래스 코드 작성의 부담도 덜고, 부가 기능 부여 코드가 중복되어 나타나는 문제도 일부 해결할 수 있었다. 일부 메소드에만 트랜잭션을 적용해야 하는 경우, 메소드 선정 패턴 등을 이용할 수 있었다. 그러나 동일한 기능의 프록시를 여러 오브젝트에 적용할 경우 오브젝트 단위로는 중복이 일어나는 해결하지 못했다.

프록시 기술을 추상화한 스프링의 프록시 팩토리 빈을 이용해서 다이나믹 프록시 생성 방법에 DI를 도입했다. 내부적으로 템플릿 콜백 패턴을 활용하는 스프링의 프록시 팩토리 빈 덕분에 부가 기능을 담은 어드바이스와 부가기능 선정 알고리즘을 담은 포인트컷은 프록시에서 분리될 수 있었고 여러 프록시에서 공유해서 사용할 수 있게 되었다.

### 자동 프록시 생성 방법과 포인트컷

트랜잭션 대상이 되는 빈마다 일일히 프록시 팩토리 빈을 설정해야 하는 부담이 남아있었다.

이를 해결하기 위해 스프링 컨테이너의 빈 생성 후처리 기법을 활용해 <u>컨테이너 초기화 시점에 자동으로 프록시를 만들어주는 방법</u>을 도입했다. 프록시를 적용할 대상을 일일히 지정하지 않고, 패턴을 통해 자동으로 선정할 수 있도록, 클래스 선정 기능을 담은 확장된 포인트컷을 사용했다.

결국 트랜잭션 부가기능을 어디에 적용할 지에 대한 정보를 포인트컷이란 독립적인 정보로 완전히 분리하였다. 간단한 설정만으로 적용 대상을 손쉽게 선택할 수 있게 되었다.

### 부가 기능의 모듈화

관심사가 같은 코드를 분리해 한데 모으는 것은 SW 개발의 가장 기본이 되는 원칙이다. 하지만 트랜잭션 적용 코드는 기존에 써왔던 방법으로 독립된 모듈로 분리할 수 없었다.

다른 모듈의 코드에 부가적으로 부여되는 특징이 있기 때문에 트랜잭션 코드는 한데 모을 수 없고, 애플리케이션 전반에 여기저기 흩어져 있다.

핵심기능과 같은 방법으로는 모듈화하기 매우 힘들다. 스스로 독립적인 방식으로 존재해서 적용되기 어렵기 때문이다. 트랜잭션 부가기능이란 트랜잭션 기능을 추가해줄 다른 대상, 즉 타깃이 존재해야 의미가 있다. 따라서 각 기능을 부가할 대상인 각 타깃의 코드 안에 침투하거나 긴밀하게 연결되어 있지 않으면 안 된다. 기능이 부여되는 타깃은 애플리케이션의 핵심 기능이다.

핵심 기능을 가진 모듈은 그 자체로 독립적으로 존재할 수 있으며, 독립적으로 테스트 가능하고, 최소한의 인터페이스를 통해 다른 모듈과 결합해 사용하면 된다. 반면에 부가기능은 핵심기능과 같은 레벨에서 독립적으로 존재할 수 없다.

많은 개발자는 핵심기능을 담당하는 코드 여기저기에 흩어져 있던 부가기능을 어떻게 독립적인 모듈로 만들 수 있을까 고민했다. DI, 데코레이터 패턴, 다이나믹 프록시, 오브젝트 생성 후처리, 자동 프록시 생성, 포인트컷 같은 기법은 이런 문제를 해결하기 위해 적용한 대표적인 방법이다.

이 덕분에 부가기능인 트랜잭션 설정 기능은 TransactionAdvice로 모듈화될 수 있었다. 독립적으로 모듈화되어 있기 때문에 코드는 중복되지 않으며, 변경이 필요한 곳에서만 수정하면 된다. 또한 포인트컷을 통해 부가기능을 부여할 대상을 선정할 수 있었다. 이 덕분에 핵심기능을 담은 코드와 설정에는 전혀 영향을 주지 않아도 됬다.

지금까지 한 모든 작업은 핵심기능에 부여되는 부가기능을 효과적으로 모듈화하는 방법을 찾는 것이었고, 어드바이스와 포인트컷을 결합한 어드바이저가 단순하지만 이런 특성을 가진 모듈의 원시적인 형태로 만들어지게 되었다.

### AOP: 애스펙트 지향 프로그래밍

전통적인 객체지향 설계 방법으로는 독립적인 모듈화가 불가능한 부가 기능을 어떻게 모듈화할 것인가 연구한 사람들은, 이 부가기능 모듈화 작업은 기존 객체지향 설계 패러다임과는 구분되는 새로운 특성이 있다고 생각했다. 이런 부가기능 모듈을 객체지향 기술에서 주로 사용하는 오브젝트와는 다른 Aspect로 부르기 시작했다.

그 자체로 애플리케이션의 핵심 기능을 담고 있지 않지만 애플리케이션을 구성하는 중요한 한 가지 요소이고, 핵심 기능에 부가되어 의미를 갖는 특별한 모듈을 가리킨다.

Aspect는 부가될 기능을 정의한 코드인 Advise와 Advise를 어디에 적용할지 결정하는 Pointcut을 함께 갖고 있다.

Aspect는 말 그대로 애플리케이션을 구성하는 한 가지 측으로 생각할 수 있다. 핵심기능은 깔끔한 설계를 통해서 모듈화되어 있고 객체지향의 장점을 잘 살릴 수 있도록 만들었지만, 부가기능이 핵심기능의 모듈에 침투해 들어가면서 설계와 코드가 지저분해졌다.

핵심기능을 담은 코드는 부가기능인 트랜잭션 코드와 함께 섞여 있어서 핵심기능인 사용자 관리 <u>로직을 파악하고, 수정하고, 테스트하기 매우 불편</u>했다. 트랜잭션 외에도 핵심기능이 아닌 다양한 부가기능을 모두 넣으면 아마도 핵심기능은 부가기능 코드에 가려서 보이지 않을 수 있다. 게다가 이런 부가기능 코드는 여기저기 메소드에 흩어져서 나타나고 코드는 중복된다. 기존의 객체지향 설계 기법으로 해결할 수 없었다.

![image](/images/book/toby-ch-06-aop-11.png)

2차원 평면 구조에서 해결할 수 없었던 것을 3차원의 다면체 구조로 가져가면서 각각 성격이 다른 부가기능은 다른 면에 존재하도록 만들었다. 이렇게 독립된 측면에 존재하는 애스펙트로 분리한 덕분에 핵심기능은 순수하게 그 기능을 담은 코드로만 존재하고 독립적으로 살펴볼 수 있도록 구분된 면에 존재하게 된 것이다.

이렇게 애플리케이션 핵심 기능에서 부가 기능을 분리해서 애스펙트라는 독특한 모듈로 만들어서 설계하고 개발하는 방법을 Aspect Oriented Programming 또는 AOP로 부른다. AOP는 OOP를 돕는 보조적인 기술일 뿐 OOP를 완전히 대체하는 새로운 개념은 아니다. AOP는 애스펙트를 분리함으로써 핵심기능을 설계하고 구현할 때 객체지향적인 가치를 지킬 수 있도록 도외주는 것이다.

AOP는 결국 애플라케이션을 다양한 측면에서 독립적으로 모델링하고, 설계하고, 개발할 수 있도록 만들어주는 것이다. 그래서 애플리케이션을 다양한 관점에서 바라보며 개발할 수 있게 도와준다.

애플리케이션을 사용자 관리라는 핵심 로직 대신 트랜잭션 경계설정 관점에서 바라보고 그 부분에 집중해서 설계하고 개발할 수 있게 된다는 의미이다. 애플리케이션을 특정한 관점 기준으로 바라볼 수 있게 해준다는 의미에서 AOP를 관점 지향 프로그래밍이라고도 한다.

### 6.5.5. AOP 적용기술

### 프록시를 이용한 AOP

스프링은 IoC/DI 컨테이너와 다이내믹 프록시, 데코레이터 패턴, 프록시 패턴, 자동 프록시 생성 기법, 빈 오브젝트의 후처리 조작 기법 등 다양한 기술을 조합해 AOP를 지원한다. 그 중 가장 핵심은 프록시를 이용했다는 것이다. 프록시로 만들어서 DI로 연결된 빈 사이에 적용해 타깃의 메소드 호출 과정에 참여해서 부가기능을 제공해주도록 만들었다. 따라서 스프링 AOP는 자바의 기본 JDK와 스프링 컨테이너 외에는 특별한 기술이나 환경을 요구하지 않는다.

스프링 AOP의 부가기능을 담은 어드바이스가 적용되는 대상은 오브젝트의 메소드다. <u>프록시 방식을 사용했기 때문에 메소드 호출 과정에 참여해서 부가기능을 제공</u>한다. 어드바이스가 구현하는 MethodInterceptor 인터페이스는 다이내믹 프록시의 InvocationHandler와 마찬가지로 프록시로부터 메소드 요청정보를 전달받아서 타깃 오브젝트의 메소드를 호출한다. 타깃의 메소드를 호출히는 전후에 다양한 부가기능을 제공할 수 있다.

프록시는 독립적인 부가기능 모듈을 다양한 타깃 오브젝트의 메소드에 다이내믹하게 적용해주기 위해 가장 중요한 역할을 한다. 그래서 스프링 AOP는 프록시 방식의 AOP 라고 할 수 있다.

### 바이트코드 생성과 조작을 통한 AOP

가장 강력한 AOP 프레임워크로 꼽히는 AspectJ는 프록시를 사용하지 않는 대표적인 AOP 기술이다. 스프링도 AspectJ의 뛰어난 포인트컷 표현식을 차용해서 사용할 만큼 매우 성숙하고 발전한 AOP 기술이다. AspectJ는 스프링처럼 다이내믹 프록시 방식을 사용하지 않는다. 프록시를 사용하지 않고 어떻게 독립적으로 만든 부가기능을 다이내믹하게 다양한 타깃 오브젝트에 적용할까?

AspectJ는 프록시처럼 간접적인 방법이 아니라, 타깃 오브젝트를 뜯어 고쳐서 부가기능을 넣어주는 직접적인 방법을 사용한다. 컴파일된 타깃의 클래스 파일 자체를 수정하거나 클래스가 JVM에 로딩되는 시점을 가로채서 바이트코드를 조작하는 복잡한 방법을 사용한다. 트랜잭션 코드가 UserService 클래스에 비즈니스 로직과 함께 있었을 때처럼 만든다. 물론 소스코드를 수정하지 않으므로 개발지는 계속해서 비즈니스 로직에 충실한 코드를 만들 수 있다.

AspectJ는 프록시 같은 방법이 있음에도 왜 컴파일된 클래스 파일 수정이나 바이트코드 조작과 같은 복잡한 방법을 사용할까?

1. 바이트코드를 조작해서 타깃 오브젝트를 수정하면 스프링 같은 DI 컨테이너의 도움을 받아 자동 프록시 생성 방식을 사용하지 않더라도 AOP를 적용할 수 있기 때문이다. 스프링 같은 컨테이너가 사용되지 않는 환경에서도 손쉽게 AOP 적용이 가능해진다.

2. 프록시 방식보다 훨씬 강력하고 유연한 AOP가 가능하다. 프록시를 AOP로 사용하면 부가기능을 부여할 대상은 호출되는 메소드로 제한된다. 하지만 바이트코드를 직접 조작해서 AOP를 적용하면 <u>오브젝트의 생성, 필드 값의 조회와 조작, 스태틱 초기화 등의 다양한 작업에 부가 기능을 부여</u>할 수 있다. 타깃 오브젝트가 생성되는 순간 부가기능을 부여해주고 싶을 수 있다. 그러나 프록시 방식에서는 이런 작업이 불가능하다. 프록시 패턴을 적용할 수 있는 대상이 아니기 때문이다.

   프록시 적용이 불가능한 private 메소드의 호출, 스태틱 메소드 호출이나 초기화, 심지어 필드 입출력 등에 부가기능을 부여하려고 하면 클래스 바이트코드를 직접 조작해서 타깃 오브젝트나 호출 클라이언트의 내용을 수정하는 것 밖에 방법이 없다.

AspectJ 같은 고급 AOP 기술은 바이트코드 조작을 위해 JVM의 실행 옵션을 변경하거나, 별도의 바이트코드 컴파일러를 사용하거나, 특별한 클래스 로더를 사용하는 등의 번거로운 작업이 필요하다. 따라서 일반적인 AOP를 적용하는 데는 프록시 방식의 AOP로 충분하다. 간혹 특별한 AOP 요구사항이 생겨서 스프링의 프록시 AOP 수준을 넘어서는 기능이 필요하다면 그 때 AspectJ를 사용하면 된다.

### 6.5.6. AOP 용어

- 타깃
  부가기능을 부여할 대상
  핵심기능을 담은 클래스일 수도 있지만 경우에 따라서는 다른 부가기능을 제공하는 프록시 오브젝트일 수도 있다.

- 어드바이스
  타깃에게 제공할 부가기능을 담은 모듈
  오브젝트에서 정의하기도 하지만 메소드 레벨에서 정의할 수도 있다.
  MethodInterceptor 처럼 메소드 호출 과정 전반에 참여하는 것도 있지만, 예외 발생했을 때만 동작하는 어드바이스처럼 메소드 호출 과정의 일부에서만 동작하는 어드바이스도 있다.

- 조인 포인트
  어드바이스가 적용될 수 있는 위치
  스프링 프록시 AOP에서 조인 포인트는 메소드 실행 단계 뿐이다. 타깃 오브젝트가 구현한 인터페이스의 모든 메소드는 조인 포인트가 된다.

- 포인트컷
  어드바이스를 적용할 조인 포인트를 선별하는 작업 또는 그 기능을 정의한 모듈
  스프링 AOP의 조인 포인트는 메소드의 실행이므로, 스프링의 포인트컷은 메소드를 선정하는 기능을 갖고 있다.

  (그래서 포인트컷 표현식은 메소드의 실행 의미인 execution으로 시작하고, 메소드의 시그니처를 비교하는 방법을 주로 이용한다. 메소느는 클래스 안에 존재하기 때문에 메소드 선정이란 결국 클래스를 선정하고 그 안의 메소드를 선정하는 과정을 거치게 된다.)

- 프록시
  클라이언트와 타깃 사이에 투명하게 준재하면서 부가기능을 제공하는 오브젝트
  DI를 통해 타깃 대신 클라이언트에게 주입되며 클라이언트의 메소드 호출을 대신 받아서 타깃에 위임해주면서 그 과정에서 부가기능을 부여한다. 스프링은 프록시를 이용해 AOP를 지원한다.

- 어드바이저
  포인트컷과 어드바이스를 하나씩 갖고 있는 오브젝트
  어떤 부가기능(어드바이스)을 어디에(포인트컷) 전달할 것인가 알고 있는 AOP의 가장 기본이 되는 모듈이다. 스프링은 자동 프록시 생성기가 어드바이저를 AOP 작업의 정보로 활용한다. 어드바이저는 스프링 AOP에서만 특별히 사용되는 특별한 용어다.

- 애스펙트
  AOP의 기본 모듈
  한 개 이상의 포인트컷과 어드바이스의 조합으로 만들어지며 보통 싱글톤 오브젝트로 존재한다.

### 6.5.7. AOP 네임스페이스

스프링 AOP를 적용하기 위해 추가했던 어드바이저, 포인트컷, 자동 프록시 생성기 같은 빈들은 애플리케이션 로직을 담은 빈과는 성격이 다르다. 비즈니스 로직이나 DAO처럼 애플리케이션의 일부 기능을 담지도 않고, DI를 통해 애플리케이션 빈에서 사용되지도 않는다.

스프링 프록시 방식의 AOP를 적용하려면 최소한 네 가지 빈을 등록해야 한다.

- 자동 프록시 생성기
  스프링의 DefaultAdvisorAutoProxyCreator 클래스를 빈으로 등록한다. 다른 빈을 DI하지도 않고 자신도 DI되지 않으며, 독립적으로 존재한다.

- 어드바이스
  부가기능을 구현한 클래스를 빈으로 등록한다. TransactionAdvice는 AOP 관련 빈 중에서 유일하게 직접 구현한 클래스를 사용한다.

- 포인트컷
  스프링의 AspectJExpressionPointcut을 빈으로 등록하고, expression 프로퍼티에 포인트컷 표현식을 넣는다.

- 어드바이저
  스프링의 DefaultPointcutAdvisor 클래스를 빈으로 등록한다. 자동 프록시 생성기에 의해 자동 검색되어 사용된다.

### AOP 네임스페이스

스프링에서는 AOP를 위해 기계적으로 적용하는 빈들을 간편한 방법으로 등록할 수 있다. 스프링은 AOP와 관련된 태그를 정의해둔 aop 스키마를 제공한다. aop 스키마에 정의된 태그는 별도의 네임스페이스를 지정해서 디폴트 네임스페이스의 `<bean>` 태그와 구분해서 사용할 수 있다.