# Generics
- Java 5에 추가된 Spec
- 클래스, 메소드에서 사용할 데이터 타입을 외부에서 지정하는 기법을 의미한다.

## 왜 쓰나?
1. 타입 안정성<br/>
컴파일 타임에 타입 체크하기 때문에, 잘못된 타입이 들어와 발생할 수 있는 문제를 컴파일 타임에 잡아내어 방지할 수 있다.

2. 코드 재사용성<br/>
제네릭으로 선언된 클래스를 사용하는 코드에서 알맞게 타입을 지정하여 타입에 따라 매번 클래스를 새로 선언해 줄 필요가 없으므로 코드의 재사용성을 높일 수 있다.


## Covariance, 공변성
Java Generices는 기본적으로 무공변 성질을 가진다. 전달받은 타입으로만 캐스팅 가능하며, 타입 파라미터(꺽쇠 괄호 타입) 끼리 상속 관계더라도 캐스팅이 불가하다.

```java
ArrayList<Object> parent = new ArrayList<>();
ArrayList<Integer> child = new ArrayList<>();

parent = child; // 업캐스팅 불가
child = parent; // 다운캐스팅 불가
```

::: warning 변성
타입의 상속 계층 관계에서 서로 다른 타입 간에 어떤 관계가 있는지 나타내는 지표

**Covariance, 공변성**
- C가 P의 하위 타입이면
	- C[]는 P[]의 하위 타입
	- List\<C\>는 List\<P\>의 하위 타입

**Contravariance, 반공변성**
- C가 P의 하위 타입이면
	- P[]는 C[]의 하위 타입
	- List\<P\>는 List\<C\>의 하위 타입

**Invariance, 무공변성**
- C가 P의 서로 관계 없다.
	- P[]는 C[]의 서로 다른 타입
:::

## Wildcard, 와일드카드
와일드카드는 모든 타입을 대신할 수 있다.

코드를 이해하기 위해 다음 3가지 클래스가 존재한다 가정하자.

```java
class MyGrandParent { }

class MyParent extends MyGrandParent { }

class MyChild extends MyParent { }
```

### Unbounded Wildcards
- 정해지지 않은 unknown type으로 타입 제한이 없다.

```java
List<?> list = new ArrayList<Integer>();
```
컬렉션의 요소를 추가하는 경우 제한이 없는 와일드카드는 unknown type이므로 컴파일러가 어떤 타입인지 알 수 없다. 요소 추가를 허용하면 Integer, String 등 다양한 클래스를 추가할 수 있어 타입 안전성을 보장할 수 없으므로, 요소 추가 연산을 허용하지 않는다.

```java
@Test
void genericTest() {
    Collection<?> c = new ArrayList<String>();
    c.add(new Object()); // 컴파일 에러 (요소 추가 연산 허용 X)
}
```
즉, 컬렉션의 add로 값을 추가하려면 T 또는 T의 자식을 넣어야 하는데, 비제한 와일드카드는 unknown type으로 범위가 정해지지 않으므로 어떤 타입을 대표하는지 알 수 없어서 자식 여부를 검사할 수 없다.

Java에서는 위와 같은 문제를 해결하기 위해 한정적 와일드카드를 제공한다. 특정 타입을 기준으로 상한 범위와 하한 범위를 지정함으로써 호출 범위를 확장 또는 제한할 수 있다. 한정적 와일드카드에는 상한 / 하한 와일드카드가 있다.

### Upper Bounded Wildcards
- 와일드카드 타입에 `extends`를 사용해서 와일드카드 타입의 최상위 타입을 정의하여 상한 경계를 설정한다.
- `<? extends T>` 형식으로 선언하며, T와 T의 자식 클래스만 사용 가능하다.
- 공변성을 가진다.


```java
List<? extends MyParent> covariantList = new ArrayList<Object>();  // 컴파일 에러
List<? extends MyParent> covariantList2 = new ArrayList<MyGrandParent>();  // 컴파일 에러
List<? extends MyParent> covariantList3 = new ArrayList<MyParent>();
List<? extends MyParent> covariantList4 = new ArrayList<MyChild>();
```

컬렉션에서 MyChild 타입으로 요소를 꺼내어 만드는(produce) 경우 컴파일 에러가 발생한다.

```java
void printCollection(Collection<? extends MyParent> c) {
    // 컴파일 에러
    for (MyChild e : c) {
        System.out.println(e);
    }

    for (MyParent e : c) {
        System.out.println(e);
    }

    for (MyGrandParent e : c) {
        System.out.println(e);
    }

    for (Object e : c) {
        System.out.println(e);
    }
```

extends는 자식 클래스를 만들 때 사용되므로 `<? extends MyParent>`으로 가능한 타입은 MyParent와 미지(unknown)의 모든 MyParent 자식 클래스들이다. 미지의 MyParent 자식 클래스라는 것은 자식이 어떤 타입인지 알 수 없다는 것으로, 그 타입이 MyChild 일 수도 있지만, 아닐 수도 있다. 예를 들어 또 다른 MyParent의 자식인 AnotherChild 라는 클래스가 있다고 하자.

```java
class AnotherChild extends MyParent { }
```

`<? extends MyParent>` 타입으로는 MyChild와 AnotherChild (또는 그 외의 타입)이 될 수도 있다. 컬렉션 c에서 꺼내서 만들어지는 객체(produce)가 반드시 MyChild 타입이 아닌 AnotherChild가 될 수 있기 때문에 MyChild 타입으로 꺼내려고 시도하면 컴파일 에러가 발생한다. 하지만 적어도 MyParent 임은 확실하므로 MyParent와 그 부모 타입으로 꺼낼 수 있다.

요소를 소모(consume)하여 컬렉션에 추가하는 경우에는 상황이 달라진다. 다음과 같이 요소를 추가하는 코드는 모든 타입에 대해 컴파일 에러가 발생한다.

```java
void addElement(Collection<? extends MyParent> c) {
    c.add(new MyChild());        // 컴파일 에러
    c.add(new MyParent());       // 컴파일 에러
    c.add(new MyGrandParent());  // 컴파일 에러
    c.add(new Object());         // 컴파일 에러
}
```

`<? extends MyParent>` 으로 가능한 타입은 MyParent와 미지(unknown)의 모든 MyParent 자식 클래스들이므로, 우리는 c가 MyParent의 하위 타입 중에서 어떤 타입인지 모르기 때문이다. 먼저 하위 타입으로는 MyChild가 될 수도 있지만, AnotherChild와 같은 또 다른 하위 타입이 될 수도 있으므로 하위 타입을 결정할 수 없다. 따라서 상한 경계가 지정된 경우에는 하위 타입을 특정할 수 없으므로 새로운 요소를 추가할 수 없다.

만약 요소를 소모(cousume)하여 컬렉션에 추가하고 싶다면, 하한 경계를 지정한다.

### Lower Bounded Wildcards
- 와일드카드 타입에 `super`를 사용해서 와일드카드 타입의 최하위 타입을 정의하여 하한 경계를 설정한다.
- `<? super T>` 형식으로 선언하며, T와 T의 부모 클래스만 사용 가능하다.
- 반공변성을 가진다.


```java
List<? super MyParent> contravariantList = new ArrayList<Object>();
List<? super MyParent> contravariantList2 = new ArrayList<MyGrandParent>();
List<? super MyParent> contravariantList3 = new ArrayList<MyParent>();
List<? super MyParent> contravariantList4 = new ArrayList<MyChild>();  // 컴파일 에러
```

만약 요소를 소모(cousume)하여 컬렉션에 추가하고 싶다면,

```java
void addElement(Collection<? super MyParent> c) {
    c.add(new MyChild());
    c.add(new MyParent());
    c.add(new MyGrandParent());  // 컴파일 에러
    c.add(new Object());         // 컴파일 에러
}
```

컬렉션 c가 갖는 타입은 적어도 MyParent의 부모 타입들이다. 그러므로 해당 컬렉션에는 MyParent의 자식 타입이라면 안전하게 컬렉션에 추가할 수 있고, 부모 타입인 경우에만 컴파일 에러가 발생한다.

상한 경계와 반대로 컬렉션에서 값을 꺼내서 요소를 만드는(produce) 경우 상황이 다르다.
```java
void printCollection(Collection<? extends MyParent> c) {
    // 컴파일 에러
    for (MyChild e : c) {
        System.out.println(e);
    }
    // 컴파일 에러
    for (MyParent e : c) {
        System.out.println(e);
    }
    // 컴파일 에러
    for (MyGrandParent e : c) {
        System.out.println(e);
    }

    for (Object e : c) {
        System.out.println(e);
    }
```

- 상위 타입부터 살펴보면<br/>
	`<? super MyParent>`으로 가능한 타입은 MyParent와 미지의 MyParent 부모 타입들이므로, 부모 타입을 특정할 수 없어 모든 부모 타입들에 제약(컴파일 에러)이 발생한다. Object 같은 경우에는 Java에서 지원하는 모든 객체의 부모임이 명확하므로, 특별히 Object 타입의 객체로 만드는(produce) 경우에는 컴파일 에러가 발생하지 않는다.
- 하위 타입의 경우<br/>
	`<? super MyParent>`으로 가능한 타입은 MyParent와 미지의 MyParent 부모 타입들이므로 MyChild와 같이 경계 아래의 하위 타입들은 당연히 추가될 수 없기 때문이다.

## PECS 공식
언제 와일드카드에 extends 또는 super를 사용할 지 헷갈릴 수 있다. 이 고민에 대해 Effective Java 서적에서는 PECS 공식을 소개한다.

PECS는 ***Producer-Extends, Consumer-Super***의 약자로 다음을 의미한다.

즉, 컬렉션으로부터
- 와일드카드 타입의 객체를 꺼내 생산(Produce) 하면 `<? extends T>` 를 사용 (하위 타입으로 제한)
- 갖고 있는 객체를 컬렉션에 소비(Consume) 한다면 `<? super T>` 를 사용 (상위 타입으로 제한)

```java
void printCollection(Collection<? extends MyParent> c) {
    for (MyParent e : c) {
        System.out.println(e);
    }
}

void addElement(Collection<? super MyParent> c) {
    c.add(new MyParent());
}
```

`printCollection()`은 컬렉션으로부터 요소를 꺼내 와일드카드 타입 객체를 생산(Produce) 한다. 반대로 `addElement()`는 컬렉션에 해당 타입의 요소를 추가하여 객체를 소비(Consume) 한다. 따라서 와일드카드 타입의 객체를 produce하는 `printCollection()`은 extends, 객체를 소비하는 `addElement()`에는 super가 적합하다.

## Type Erasure
컴파일 시점에 제네릭 타입 정보를 제거하는 매커니즘. 컴파일 이후에는 제네릭 타입은 사라진다. 제네릭 도입 이전(JDK 1.5 이전) 소스 코드와 호환성을 유지하기 위함이다.

이로 인해 제네릭의 일부 기능이 제한된다. 제네릭 타입의 인스턴스 생성, 배열 선언이 불가하다. 또한 런타임 시점에 제네릭 타입의 타입 체크(`instanceof` 사용) 가 불가하다. 컴파일 시점에 제네릭 타입의 정보가 제거되기 때문이다.

## References
- https://mangkyu.tistory.com/241
- https://inpa.tistory.com/entry/JAVA-%E2%98%95-%EC%A0%9C%EB%84%A4%EB%A6%AD-%EC%99%80%EC%9D%BC%EB%93%9C-%EC%B9%B4%EB%93%9C-extends-super-T-%EC%99%84%EB%B2%BD-%EC%9D%B4%ED%95%B4
- https://inpa.tistory.com/entry/JAVA-%E2%98%95-%EC%A0%9C%EB%84%A4%EB%A6%AD-%ED%83%80%EC%9E%85-%EC%86%8C%EA%B1%B0-%EC%BB%B4%ED%8C%8C%EC%9D%BC-%EA%B3%BC%EC%A0%95-%EC%95%8C%EC%95%84%EB%B3%B4%EA%B8%B0