# Runtime Data Area

- JVM이 할당 받는 메모리 영역
- PC Register, JVM Stack, Native Method Stack는 스레드마다 하나씩 생성되며 Method Area, Heap는 모든 스레드가 공유해서 사용한다.

![Runtime Data Area](/images/java/20240701-jvm-runtime-data-area-3.png)
_출처 : https://inpa.tistory.com/entry/JAVA-%E2%98%95-JVM-%EB%82%B4%EB%B6%80-%EA%B5%AC%EC%A1%B0-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EC%98%81%EC%97%AD-%EC%8B%AC%ED%99%94%ED%8E%B8_

## Method Area

- 모든 스레드들이 공유하는 메모리 영역
- 로드된 Type을 저장하는 논리적인 메모리 공간 (로드된 클래스, 인터페이스 정보 저장)
	- Type이란 변수의 형으로도 사용하지만 메소드 영역에서는 Class, Interface를 의미
	- Type의 바이트코드 뿐만 아니라 모든 변수, 상수, 레퍼런스, 메소드 데이터 등 포함
	- Class, Instance, Interface의 초기화에 사용되는 클래스 변수, 메소드와 생성자 정보 포함
- Class Loader에게 넘겨받은 클래스 파일에서 Type 관련 정보를 추출하여 저장한다.
- JVM이 기동할 때 생성되며 GC의 대상이 된다.
- JVM 벤더마다 다르게 구현되어 있다.
	- Oracle Hotspot JVM의 Method Area는 JDK 7까지는 PermGen, JDK 8부터 Metaspace로 대체
- 실행 중인 프로그램의 메서드와 클래스 정보를 저장한다.
    - 필드 및 메소드 데이터, Runtime Constant Pool과 같은 클래스의 구조 정보
    - 정적 멤버 변수 (static), 상수 (static final) 포함
    - 메서드, 생성자의 바이트 코드
- 할당 시점 : 클래스 로더에 의해 클래스가 로드될 때
- 해제 시점
	- 클래스의 언로드(unload) 시점
	- 클래스 로더가 더 이상 참조되지 않고, 클래스의 Instance 존재하지 않을 때 클래스의 메타 데이터는 GC될 수 있다. (Garbage Collector에 의해)

### Type Information

- `Package.class` 형태를 지니는 타입의 전체 이름 (Fully Qualified Name)
- 타입의 슈퍼 클래스의 전체 이름
	(타입이 인터페이스, Object 클래스 또는 슈퍼 클래스 없는 경우 제외됨)
- 타입이 클래스인지 인터페이스인지 여부
- 타입의 Modifier (public, abstract, final 등)
- 인터페이스의 경우 직접 링크되는 객체의 리스트로 객체는 전체 이름(package.class)으로 표현됨

### Constant Pool

- Type의 모든 Constant 정보
	- Constant는 단지 상수의 의미만을 가지는 리터럴 상수는 물론이고, 멤버 변수, 클래스 변수, 메소드로의 모든 Symbolic Reference를 저장

::: warning Symbolic Reference
객체를 참조할 때 Java 코드 상에 메모리 주소를 언급하지 않고 이름으로 객체를 참조한다. JVM은 참조 객체에 접근할 때 Constant Pool의 Symbolic Reference를 통해 해당 객체가 위치한 메모리 주소를 찾아 동적으로 연결한다.
:::

### Field Information

- Type에서 선언된 모든 Field 정보
    - Field의 이름, 데이터 타입, 선언된 순서
    - Field의 Modifier (public, private, static, final, volatile, transient 등)
- Field Information에 Field의 정보가 선언된 순서대로 기록된다.

::: warning Field와 Variable
Java에는 인스턴스 변수, 클래스 변수, 로컬 변수, 파라미터 4가지 종류의 변수가 있다. 그 중 Field는 인스턴스 변수, 클래스 변수를 의미한다. 이들은 각각 non-static field, static field로 표현된다. 나머지 로컬 변수, 파라미터 변수는 Method에 속한다.
:::

### Method Information

- Type에서 선언된 모든 Method 정보
    - 메소드의 이름, 리턴 타입
    - 파라미터의 수와 데이터 타입, 선언된 순서
    - Method의 Modifier (public, private, static, final, synchronized, native, abstract 등)
- 만약 메소드가 native나 abstract 아닌 경우 다음 정보가 추가된다.
    - Method의 바이트 코드
    - Method Stack Frame의 Operand Stack, LocalVariable Section의 크기
    - Exception Table

### Class Variable

- `static` 으로 선언된 모든 클래스 변수 정보
- 모든 인스턴스에서 접근 가능하기 때문에 동기화 이슈가 발생할 수 있음
- 클래스 변수를 `final`로 선언한 경우 `Constant Pool`에 저장

::: warning Class와 Instance의 관계 (붕어빵 틀과 붕어빵)

- Class(붕어빵 틀)<br/>
	클래스가 로드되면 Java 코드에서 클래스 속성을 추출하여 Method Area에 기록한다. 이 클래스는 이러한 Method가 있고, 이 내용은 어떠하며 변수는 어떤 것을 가진다는 정보가 Metohd Area에 생성된다. 

- Instance(붕어빵)<br/>
	만약 이 클래스의 인스턴스를 생성한다면 Method Area의 클래스 정보를 바탕으로 Heap에 Object를 찍어낸다. 인스턴스 변수의 경우 Heap에 생성된 인스턴스에 그 값이 저장되고, 클래스 변수는 이 클래스 정보가 있는 Method Area의 Class Variable에 저장된다.
:::

### Reference to Class ClassLoader

Type이 JVM에 로드될 때, <u>이 Type은 어떤 클래스 로더를 경유하여 로드되었는지 추적</u>한다. 한 Type이 다른 Type을 참조할 때 같은 클래스 로더를 사용하도록 되어 있기 때문이다.

Type이 User-Defined ClassLoader를 통해 로딩된 경우 이 클래스 로더의 Reference를 Type 정보 중 하나로 저장한다. 반면 Bootstrap ClassLoader의 경우는 Reference를 `null`로 저장한다.

이 정보는 Dynamic Linking할 때 해당 타입과 동일한 클래스 로더를 통해 참조하는 타입을 로딩하기 위해 사용된다.

### Reference to Class class

Type이 JVM에 로드되면 항상 `java.lang.class` 클래스의 인스턴스가 하나 생성된다. 그래서 Method Area에 Type 정보의 일부로 이 인스턴스의 레퍼런스를 저장한다. 우리가 `getName()`을 통해 클래스의 이름을 알아오거나 `isInterface()` 로 인터페이스 여부를 알 수 있는 것든 이 class 인스턴스의 Reference를 통하기 때문이다.

### Method Table

- Class의 메소드에 대한 Direct Reference를 갖는 자료구조 (메소드 호출을 위한 자료구조)
	- JVM은 Method Table을 통해 Method Reference를 빠르게 수행할 수 있다.
- Interface나 Abstract Class가 아닌 실체를 가진 Class 정보의 일부로, 해당 Class의 메소드 뿐만 아니라 Super Class에서 상속된 Method의 레퍼런스까지 포함한다.


::: warning Class B가 Class A를 상속받은 경우, Class B에서 슈퍼 클래스 a2() 메서드를 참조한다면?

![method table](/images/java/20240701-jvm-runtime-data-area-5.png)
_출처 : Java Performance Fundamentals / 김한도 저_

Class B의 인스턴스에서 Class B의 Method Area의 정보를 통해 해당 Method가 A를 상속 받았다는 것을 알게 되고 다시 Class A의 Method Area로 가서 적당한 인스턴스를 찾을 것이다.

Method Table 있다면, Class B는 상속받은 메서드에 대한 Heap Instance 정보를 가지고 있기 때문에 이를 통해 Class A의 인스턴스를 바로 찾아갈 수 있다.

즉, Method Table을 통해 Reference의 속도를 높일 수 있다.
:::

## Heap

- 동적으로 생성되는 객체의 인스턴스, Array를 저장하는 공간.
- 모든 스레드들이 공유하는 메모리 영역
- GC의 대상이다.
- 할당 시점 : `new`로 인스턴스 또는 배열 생성 시
- 해제 시점 : 객체가 더 이상 사용되지 않거나, 명시적으로 `null` 할당될 때
- JVM 벤더마다 다르게 구현되어 있다.

### 구조 (Oracle Hostpot JVM 기준)

#### Eden (Young Generation)

- 새로 생성된 객체가 최초로 저장되는 공간
- GC 이후 살아남은 객체들은 Survivor 영역(S1 or S2) 으로 이동

#### Survivor 1, 2 (Young Generation)

- 적어도 1번의 GC 이후 살아남은 객체가 저장되는 공간
- 둘 중 한 영역은 반드시 비어있다.
  - S1 또는 S2 중 한 영역이 꽉 차면 둘 중 살아남은 Survivor 영역으로 이동한다.


#### Old Generation

- Young Generation에서 오래 살아남은 객체가 저장되는 공간
- Promotion : Young Generation에서 오래 살아남은 객체가 Old Generation으로 이동하는 것

::: warning 왜 Young, Old로 나누었을까?
대부분의 객체 수명이 짧으므로, 오래 살아남는 객체와 빨리 죽는 객체를 분리하여 처리하면 Garbage Collector의 메모리 스캔 범위를 줄일 수 있어 효율적이다.<br/>
세대를 나누면 Young Generation은 자주 GC 수행하여 짧은 수명의 객체를 빨리 정리할 수 있으며, Old Generation은 덜 빈번하게 GC 수행하여 메모리를 효율적으로 관리할 수 있다.
:::

#### Permanent Generation (Java 8 이전)

![Java 8 이전 PermGen](/images/java/20240701-jvm-runtime-data-area-1.png)
_출처 : https://velog.io/@l_cloud/JDK%EB%A1%9C-%EA%B6%81%EA%B8%88%EC%A6%9D%EC%9D%84-%ED%95%B4%EA%B2%B0%ED%95%B4%EB%B3%B4%EC%9E%90_

- 저장 정보
  - 클래스, 메소드의 메타 데이터
  - static 객체, 상수 (static final)
  - 스트링 리터럴
  - JVM 내부 객체들과 JIT 최적화 정보
- 문제점 : 메모리 관리의 불편함
  - 스트링 리터럴, static Collection 객체들이 쌓여 `java.lang.OutOfMemory` 에러 발생

> **메타 데이터**
>
> 클래스의 구조, 메서드와 변수의 정보, 어노테이션 정보 등을 포함한 클래스와 관련된 정보를 말한다. JVM이 클래스를 로드하고 실행할 때 이 정보들을 참조한다.
> {: .prompt-warning }

#### Metaspace (Java 8 이후)

![Java 8 이후 Metaspace](/images/java/20240701-jvm-runtime-data-area-2.png)
_출처 : https://velog.io/@l_cloud/JDK%EB%A1%9C-%EA%B6%81%EA%B8%88%EC%A6%9D%EC%9D%84-%ED%95%B4%EA%B2%B0%ED%95%B4%EB%B3%B4%EC%9E%90_

- Java 8 이전의 Permanent Generation은 Java 8부터 Metaspace로 변경
- Native Memory 영역에 저장되어 OS에 의해 관리된다.
- Permanent Generation의 OOM 에러 현상을 개선하기 위해 static 객체, 상수화된 static 객체를 Heap으로 이동시켜 GC의 대상이 되도록 변경하고, 메타 데이터 정보들을 OS가 관리하는 영역으로 옮겨 Permanent Generation의 사이즈 한계를 해결했다.
- 저장 정보 변경 사항
  - 클래스, 메소드의 메타 데이터 - `Metaspace`
  - static 객체, 상수 (static final) - `Heap`
  - 스트링 리터럴 - `Heap`
  - JVM 내부 객체들과 JIT 최적화 정보 - `Metaspace`



## JVM Stack

![JVM 스택 구성](/images/java/20240701-jvm-runtime-data-area-4.png)
_출처 : Java Performance Fundamentals / 김한도 저_

- 스택 프레임(Stack Frame) 구조체를 저장하는 스택
  - JVM은 JVM Stack에 스택 프레임을 추가(push)하고 제거(pop) 동작만 수행한다.
- 메서드 호출 시 `Stack Frame`이 생성되어 해당 스레드의 JVM 스택에 추가된다.
- 각 스레드 별로 하나씩 보유한다.

### Stack Frame

- 호출된 메서드의 매개 변수, 지역 변수, 리턴 값, 연산 중 일어나는 값을 임시로 저장한다.
- 메서드 호출 시 생성되며 메서드가 종료되면 스택 프레임은 제거된다.
- 스택 프레임의 사이즈는 고정되며, 컴파일 타임에 이미 결정된다.
	- 메소드 내에서 사용되는 변수, 연산 내용, 반환 값의 타입 등은 이미 소스 코드 내에서 결정되기 때문이다.

#### Local Variable Array
- 메소드의 매개 변수, 지역 변수를 저장한다.
- 0번째 요소 : 메서드가 속한 클래스 인스턴스의 this 레퍼런스
    - 이 레퍼런스를 통해 Heap에 있는 클래스의 인스턴스를 찾아간다.
- 1번째 요소 ~ : 전달된 매개 변수가 저장된 후, 지역 변수가 차례로 저장
  

::: warning Object나 Array, String 등 객체는 가변 크기인데 스택의 크기는 고정될 수 있을까?
Object나 Array, String 등의 객체는 Reference Type으로 실제 객체는 Heap에 저장된다. 즉 Local Variable Array에는 해당 객체가 존재하는 Heap의 위치를 말해주는 Reference를 저장하므로 스택의 크기는 고정될 수 있다.
:::
	
::: warning Integer 형과 int 기본 타입 중 어떤 것이 성능 측면에서 더 유리할까?
int형이다. LocalVariable Section에서 Integer형으로 선언한 변수는 Reference Type이므로 이를 사용하기 위해서는 Stack에서 Heap으로 넘어가야 하기 때문이다.
Reference로 객체를 찾는 작업은 CPU 연산이 필요하다. 따라서 변수를 사용할 때 Stack Frame에서 바로 변수 값을 얻는 것보다 Heap을 찾아가 변수 값을 읽어오는 것은 CPU 사용률이 높다. 또한 Heap에 변수 값이 존재하는 것은 Method Area의 java.lang.Integer 의 클래스 정보를 읽어 인스턴스를 생성함을 의미한다. 이로 인해 사용되는 CPU 자원, 메모리 자원도 추가될 것을 생각하면 Primitive Type를 사용하는 것이 성능 상 좋다.
:::

#### Operand Stack
- 메서드의 실제 작업 공간으로 프로그램을 수행하면서 연산에 사용되는 데이터 또는 그 결과를 저장한다.

#### Frame Data
- Constant Pool Resolution 정보와 메소드가 정상 종료될 때의 정보, 그리고 비정상 종료될 때 발생하는 Exception 정보를 저장한다.

1. Constant Pool Resolution 정보
- Constant Pool의 Reference 정보를 저장한다.

::: tip Resolution과 Constant Pool Resolution
Java는 모든 참조 정보를 Symbolic Reference로 가진다. JVM에서 Symbolic Reference를 실제로 접근할 수 있는 Direct Reference로 변경하는 작업을 Resolution이라 한다.
모든 클래스의 Symbolic Reference는 Method Area의 Constant Pool에 저장되기 때문에 Resolution을 Constant Pool Resolution이라 부른다.
:::

::: tip 활용
Java의 모든 레퍼런스는 Symbolic Reference이기 때문에 클래스, 메소드, 그리고 변수나 상수에 접근할 때, Resolution을 수행하기 위해 Constant Pool을 참조한다.  또한 특정 Object가 특정 클래스나 인터페이스에 의존 관계가 있는지 확인하기 위해서도 Constant Pool을 참조한다. 이 때 Constant Pool Resolution 정보를 참조하여 Constant Pool에 찾아간다.
:::


2. 메소드가 정상 종료될 때 필요한 정보
- 자신을 호출한 Stack Frame의 Instruction Pointer를 저장한다.
::: tip 활용
메소드가 종료되면 JVM은 이 정보를 PC Register에 설정하고 해당 Stack Frame은 POP되어 사라진다. 만약 이 메소드에 반환 값이 있다면 이 반환 값을 다음 번 Current Frame, 즉 자신을 호출한 메소드의 스택 프레임의 Operand Stack에 PUSH 한다.
:::

3. Reference to Exception Table
- 각 클래스 파일은 Exception Table을 가진다.
- 예외 발생시 JVM은 이 정보를 참조하여 catch 절의 바이트 코드로 점프한다.
- Exception Table
    ```console
    Exception table:
       from    to  target type
           5     9    12   Class java/lang/NullPointerException
    ```
    - from : try 블록이 시작되는 바이트코드의 엔트리 넘버
    - to : try 블록이 끝나는 엔트리 넘버
    - target : exception 발생했을 때 점프해야 할 엔트리 넘버
    - type : 정의한 Exception 

::: tip 활용
- 예외 발생하거나 throw 되면 type 정보와 비교하여 일치하면 target으로 점프한다.
- 일치하지 않으면 JVM은 Current Frame을 종료하고 이 메소드를 호출한 메소드의 Stack Frame에 이 Exception을 다시 던져 처리를 반복한다.
:::


## PC Register
### CPU의 Register
- Instruction을 수행하는 동안 필요한 정보를 저장하는 CPU 내 기억 장치
::: tip e.g. 1 + 2 연산
연산 대상이 되는 1 상수는 2 상수를 받을 동안 CPU 내에 잠시 기억된다.<br/>
**Operand** : 1과 2처럼 명령 실행에 사용되는 데이터들<br/>
CPU는 1과 2 Operand와 연산 명령인 *add Instruction*을 기억해야 하며, 그리고 연산 결과인 3이라는 Operand도 메모리로 전달하기 전 기억해야 한다.
이 데이터들을 기억하기 위해 사용하는 CPU 내 기억 장치를 Register라 한다.
:::

- CPU 내에 기억 레지스터, 주소 레지스터, 명령 레지스터, 연산 레지스터, 플립 플롭 레지스터 등 수십 개의 레지스터를 가지고 있다.

### JVM의 PC Register
- Stack Base 메모리 공간
	- Register Base로 구동되지 않고 Stack Base로 작동한다. JVM은 Stack에서 Operand를 뽑아내어 별도의 메모리 공간에 저장한다.

::: warning 왜 JVM에 PC 레지스터를 두었을까?
레지스터는 CPU의 기억장치로 CPU에 종속된다.
Java는 플랫폼 독립적이지만, JVM도 OS / CPU 입장에선 CPU 위에서 동작하는 하나의 프로세스일 뿐이기 때문에 CPU 리소스를 사용해야 한다. 그렇기 때문에 Java도 현재 작업 내용을 CPU에 Instruction으로 제공해야 하며, 이를 위한 버퍼 공간으로써 PC Register라는 메모리 영역을 생성한 것이다.
:::

- 각 스레드 별로 하나씩 보유하며, 스레드가 시작될 때 생성된다.
- 스레드가 Java Method를 수행하고 있다면 이 PC Register에는 <u>현재 수행 중인 JVM Instruction의 주소가 저장</u>된다. 만약 C언어로 Native Method(또는 Function)을 수행한다면 PC Register는 `undefined` 상태로 있게 된다. PC Register에 저장되는 Instruction의 주소는 Native Pointer 또는 Method Bytecode의 시작점일 수 있다.


## References
- Java Performance Fundamentals / 김한도 저
- https://d2.naver.com/helloworld/1230
