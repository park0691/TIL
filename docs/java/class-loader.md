# 클래스 로더, Class Loader
바이트 코드를 동적 로딩 방식으로 런타임 데이터 영역(JVM 메모리)에 올리는 역할을 수행한다.

::: tip 동적 로딩(Dynamic Loading)
프로세스가 시작될 때 그 프로세스의 주소 공간 전체를 메모리에 올려놓는 것이 아니라, 필요한 루틴이 호출될 때 해당 루틴을 메모리에 적재하는 방식이다. 즉, 필요한 시점에 적재하여 메모리를 좀 더 효율적으로 사용할 수 있다.
:::

## 동적 로딩
### 로드 타임 동적 로딩, Load-time Dynamic Loading
하나의 클래스를 로딩할 때 동적으로 필요한 다른 클래스를 로드하는 것을 의미한다.
```java
public class Main {
    public static void main(String[] args) {
        System.out.println(“hello”);
    }
}
```
- JVM이 시작되고 부트스트랩 클래스 로더가 생성된 후에 모든 클래스가 상속받고 있는 Object 클래스를 읽어온다.
- 이후 클래스 로더는 명령 행에서 지정한 HelloWorld 클래스를 로딩하기 위해, HelloWorld.class 파일을 읽는다.
- HelloWorld 클래스를 로딩하는 과정에서 필요한 클래스인 `java.lang.String`과 `java.lang.System`을 로드한다.
- 즉, 로드 타임에 클래스를 동적으로 로드하는 것이다.

### 런타임 동적 로딩
코드를 실행하는 순간에 클래스를 로드하는 것을 의미한다.
```java
public class Main {
    public static void main(String[] args) {
        try {
            Class clazz = Class.forName("Hello");
            Object obj = clazz.newInstance();
            Runnable r = (Runnable) obj;
            r.run();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```
- `Class.forName()` 메소드가 실행되기 전까지 Main 클래스에서 어떤 클래스를 참조하는지 알 수 없다.
- Main 클래스를 로딩할 때는 어떤 클래스도 읽어오지 않고, Main 클래스의 main() 메소드가 실행되고 `Class.forName(args[0])` 를 호출하는 순간에 `args[0]` 에 해당하는 클래스를 로딩한다.
- `args[0]` 클래스 정보를 바탕으로 인스턴스를 만들 수 있는 것은 런타임에 가능하다.
-  단순한 컴파일 타임에 해당 클래스 정보를 로드하지 않고 코드가 실행될 때 클래스 정보를 로드할 수 있는 경우를 의미한다.

### 장점
- 필요한 시점에 클래스를 로드하여 애플리케이션 시작 시간을 줄일 수 있다.
- 불필요한 리소스를 로드하지 않음으로써 JVM에서 메모리를 효율적으로 관리할 수 있다.

### 단점
- 동적 로딩에 시간이 추가적으로 소모되므로 애플리케이션의 성능이 저하될 수 있다.
- 컴파일 시점에 모든 오류가 있는지 확인할 수 없다.

## 클래스 로더를 코드로 확인해보자
### 소스 코드
```java
public class App {
    public static void main( String[] args ) {
        ClassLoader classLoader = App.class.getClassLoader();
        System.out.println(classLoader);
        System.out.println(classLoader.getParent());
        System.out.println(classLoader.getParent().getParent());
    }
}
```

### 결과
```
jdk.internal.loader.ClassLoaders$AppClassLoader@63947c6b
jdk.internal.loader.ClassLoaders$PlatformClassLoader@776ec8df
null
```
App 클래스를 로더한 클래스 로더 `AppClassLoader`를 확인할 수 있다. 부모는 `PlatformClassLoader`, 그의 부모는 `null`로 표시된다.

실제 부모는 `BootstrapClassLoader`이지만, 네이티브로 구현되어 있어서 자바 객체로 확인할 수 없다.

## 1. Loading
컴파일된 바이트 코드 `*.class`를 메모리에 로드한다.

### 클래스는 언제 로딩되나?
1. 클래스가 처음 참조될 때 (인스턴스 생성 시)
2. 클래스의 정적 멤버 사용될 때
	- 정적 변수가 사용될 때 (final X)
	- 정적 메소드가 호출될 때
3. 클래스의 서브 클래스가 로드될 때 (슈퍼 클래스도 함께 로드)

클래스를 로드할 때 다음과 같은 원칙을 따른다.

### 위임 계층 원칙, Delegation Hierarchy Principle
클래스 로더는 다음과 같이 계층 구조로 이루어져 있다.
클래스 로딩 과정에서 책임을 분산하고, 중복 로딩을 방지하기 위해 설계되었다.

![위임 계층 구조](/images/java/20240826-java-class-loader-1.png)

하위 클래스 로더는 상위 클래스 로더에 클래스 로딩을 위임한다.

![위임 계층 구조](/images/java/20240826-java-class-loader-2.png)
- 클래스 로더는 우선 자신의 부모 클래스 로더에게 클래스를 로드하도록 요청한다.
- 부모 클래스 로더는 다시 자신의 부모에게 요청을 전달하는 방식으로 최상위 클래스 로더(Bootstrap Class Loader)에 요청을 위임한다.
- 최상위 클래스 로더가 요청을 처리하지 못하면 하위 클래스 로더에게 순차적으로 요청이 전달된다.
- 클래스 못 찾으면 `ClassNotFoundException` 발생
- 장점
	- **클래스 중복 로딩 방지** : 상위 클래스 로더에서 이미 로드된 클래스를 다시 로드하지 않도록 하여 메모리 낭비를 방지한다.
    - **보안 강화** : 시스템 클래스 로더는 애플리케이션 클래스 로더보다 높은 우선순위를 가지므로, 핵심 자바 API 클래스들이 애플리케이션 코드에 의해 임의로 변경되거나 오버라이드되는 것을 방지한다.

[주요 클래스 로더]
- ***Bootstrap Class Loader***
    - 최상위 우선순위
    - JVM 기동할 때 생성되며, Object 클래스들을 비롯한 표준 Java API를 로드한다.
        - `JAVA_HOME\lib`에 있는 코어 자바 API를 제공한다.
    - 다른 클래스 로더와 달리 네이티브 코드로 구현되어, 자바 코드로 접근할 수 없다.
- ***Platform Class Loader(Java 9부터), Extension Class Loader***
    - 기본 자바 API를 제외한 확장 클래스 로드. 보안 확장 기능 등을 로드
    - `JAVA_HOME\lib\ext` 폴더 또는 `java.ext.dirs` 시스템 변수 해당 위치의 클래스를 읽는다.
- ***System Class Loader(Java 9부터), Application Class Loader***
    - 애플리케이션 클래스 패스(애플리케이션 실행할 때 주는 `-classpath` 옵션 또는 `java.class.path` 환경 변수 값에 해당하는 위치)에서 클래스를 읽는다.
    - 개발자가 작성한 대부분의 클래스를 로딩한다.

::: warning 동작 방식 예시
1. JVM 메소드 영역에 클래스가 로드되어 있는지 확인한다. 로드되어 있는 경우 해당 클래스를 사용한다. 그렇지 않다면, 먼저 System Class Loader에 클래스 로드를 요청한다.
2. System Class Loader는 Platform Class Loader에 요청을 위임한다.
3. Platform Class Loader는 Bootstrap Class Loader에 요청을 위임한다.
4. Bootstrap Class Loader는 Bootstrap Classpath(JDK/JRE/LIB)에 해당 클래스가 있는지 확인한다. 클래스가 존재하지 않다면 Platform Class Loader에게 요청을 넘긴다.
5. Platform Class Loader는 Extention Classpath(JDK/JRE/LIB/EXT)에 해당 클래스가 있는지 확인한다. 클래스가 존재하지 않다면 System Class Loader에게 요청을 넘긴다.
6. System Class Loader는 System Classpath에 해당 클래스가 있는지 확인한다. 클래스가 존재하지 않다면 ClassNotFoundException 예외를 발생시킨다.
:::

::: details 클래스 로더의 위임 방식은 어떤 이점을 가지고 있으며, 어떤 순서로 클래스를 검색하는지 설명해주세요.

[이점]
- 중복 로딩 방지
    - 부모 클래스 로더가 자식 클래스 로더보다 먼저 클래스를 로드하려고 시도하며, 이미 로드된 클래스는 재사용하기 때문에 동일한 클래스가 여러 번 로드되는 것을 방지하여 메모리 효율성을 높이고 클래스의 충돌을 예방합니다.
- 의존성 해결
    - 클래스가 의존하는 다른 클래스를 로딩할 때 상위 클래스 로더에 의해 이미 로드된 클래스를 재사용하므로 복잡한 의존성을 해결하는 데 도움이 됩니다. 예를 들어 Application ClassLoader가 사용자 정의 클래스를 로드할 때 그 클래스가 JDK 표준 라이브러리 클래스를 사용한다면 이미 Bootstrap ClassLoader에 의해 로드된 해당 클래스를 참조합니다.
- 클래스 로딩의 일관성 유지
    - 특정 클래스가 JVM 내에서 하나의 클래스 로더에 의해 로드되도록 보장합니다. 예를 들어, `java.lang.String` 클래스는 Bootstrap ClassLoader에 의해 로드되므로, JVM 내에서는 항상 동일한 `String` 클래스가 사용됩니다.
- 보안 강화
    - 상위 클래스 로더는 표준 자바 API, 확장 라이브러리를 로드합니다. 따라서 하위 클래스 로더가 핵심 자바API나 확장 클래스를 임의로 로드, 변경되는 것을 방지하여 시스템 보안과 안정성을 유지할 수 있습니다.


[순서]
- 부트스트랩 클래스 로더를 통해 표준 자바 API 클래스가 로드된 후
- 확장 클래스 로더에서 확장 클래스가 로드됩니다.
- 이후 애플리케이션 클래스 로더에서 클래스 패스에 있는 클래스를 로드합니다.
:::

### 가시성 원칙, Visibility Principle

하위 클래스 로더는 상위 클래스 로더가 로딩한 클래스를 볼 수 있지만, 상위 클래스 로더는 하위 클래스 로더가 로딩한 클래스를 볼 수 없다.

### 유일성 원칙, Uniqueness Principle

상위 클래스 로더에 의해 로드된 클래스가 하위 클래스 로더에 의해 다시 로드되지 않게 하여 유일성을 보장한다. (클래스 중복 로드 X)

이미 로드된 클래스인지 확인하기 위해 네임 스페이스에 보관된 FQCN을 기준으로 클래스를 찾고, 없다면 위임 모델을 통해서 클래스를 로드한다.

::: tip 네임 스페이스(Namespace)
로드된 클래스를 보관하는 공간으로 각 클래스 로더마다 네임 스페이스를 보유한다.
클래스 로더마다 각자 네임 스페이스를 가지기 때문에 FQCN이 같은 클래스라도 네임 스페이스가 다르면 다른 클래스로 간주한다.
:::

::: tip FQCN, Fully Qualified Class Name
패키지명 + 클래스명
:::

### 언로드 금지 원칙, No Unloading Principle

클래스 로더는 클래스를 로드할 수 있지만 로드된 클래스를 언로드할 수 없다.

대신 현재 클래스 로더를 삭제하고, 새 클래스 로더를 만들 수 있다.

## 2. Linking
- 로드된 클래스 파일들을 검증, 준비, 해석한다.

### Verification

- 읽은 클래스가 자바 언어 명세 및 JVM 명세에 명시된 대로 구성되어 있는지 검사
- 클래스 로드 전 과정 중 가장 복잡하고 시간이 많이 걸린다.
- 검증 실패시 `java.lang.VerifyError`

### Preparation

- 클래스 필드, 메서드, 인터페이스 등의 자료구조와 static 변수를 위한 메모리를 할당한다.
- 이 단계에서 static field가 만들어지고, 기본값으로 초기화된다. 코드에 작성한 원래 값은 Initialization 단계에서 할당되므로 아직은 초기화 블록, 초기화 코드가 실행되지는 않는다.

### Resolution

- 런타임 상수 풀에 있는 심볼릭 레퍼런스를 다이렉트 레퍼런스로 대체한다.

## 3. Initialization
- 클래스 변수들을 적절한 값으로 초기화한다.
    - 클래스 파일의 코드를 읽어 코드에 명시된 원래 값을 static 변수에 할당하고, static 초기화 블록이 실행된다.
- 클래스 로더를 통한 탑재 과정이 끝나면 JVM은 클래스 파일을 구동시킬 준비를 마친다.

## References
- https://velog.io/@ddangle/Java-%ED%81%B4%EB%9E%98%EC%8A%A4-%EB%A1%9C%EB%8D%94%EB%9E%80
- https://medium.com/@gsy4568/jvm%EC%9D%98-%EC%B2%AB%EA%B4%80%EB%AC%B8-classloader-ecdf93d53a7b
- https://velog.io/@ariul-dev/%EC%B0%A8%EA%B7%BC%EC%B0%A8%EA%B7%BC-%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94-Java-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%8B%A4%ED%96%89-%EA%B3%BC%EC%A0%95