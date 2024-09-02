# 함수형 인터페이스와 람다
## Functional Interface, 함수형 인터페이스
- 추상 메소드를 하나만 가지는 인터페이스

```java
@FunctionalInterface
public interface RunSomething {
    // 추상 메소드 딱 하나만 가지고 있는 인터페이스
    int doIt(int n);

    static void printName() {
        System.out.println("Hello World");
    }

    default void printAge() {
        System.out.println("40");
    }
}
```
- `@FunctionalInterface` 어노테이션을 사용하면 추상 메서드를 하나만 가지지 않는 경우 컴파일 오류를 발생시키다.
- static, default 메소드는 있어도 상관 없다.

### 사용
```java
RunSomething runSomething = (i) -> {
    System.out.println(i);
    return i;
};
System.out.println(runSomething.doIt(1));
// static method
RunSomething.printName();
// default method
runSomething.printAge();
```

### 왜 필요한가
#### 동작 파라미터화
함수형 인터페이스를 메서드의 매개변수로 사용하면 특정 동작을 인수로 전달할 수 있다.

```java
public static List<Apple> filterApples(List<Apple> apples, Predicate<Apple> p) {
    List<Apple> result = new ArrayList<>();
    for (Apple apple : apples) {
        if (p.test(apple)) {
            result.add(apple);
        }
    }
    return result;
}
```

filterApples 메서드는 함수형 인터페이스 p를 받아서 함수형 인터페이스의 test 메서드 (T -> boolean)을 수행한다.

다음은 filterApples 메서드를 사용하는 코드이다.

```java
List<Apple> heavyApples = filterApples(apples, new Predicate<Apple>() {
    @Override
    public boolean test(Apple apple) {
        return apple.getWeight() > 300;
    }
});
```
다음과 같이 함수형 인터페이스를 통해 수행할 동작을 익명 클래스로 구현하여 파라미터로 념겨줄 수 있다. 그런데 메서드 하나를 구현하는데도 코드가 장황하다. 한 눈에 안읽힌다.

```java
List<Apple> redApples = filterApples(apples, (Apple apple) -> RED.equals(apple.getColor()));

List<Apple> heavyApples = filterApples(apples, (Apple apple) -> apple.getWeight() > 300));
```
다음과 같이 람다식과 결합하면 코드의 간결성, 가독성을 높일 수 있다.

**[장점]**

- 변경에 닫혀있고 확장에 유연한 코드를 만들 수 있다. (OCP)
	- `filterApples()` 메서드의 내부 구현을 바꾸지 않고 필터 조건을 바꿀 수 있어 확장에 유연하다.
- 하나의 메서드가 다른 동작을 수행할 수 있도록 재활용할 수 있다.
	- 하나의 메서드로 색깔을 필터링, 무게로 필터링하는 동작을 다 수행할 수 있다.

## Lambda Expression, 람다식
익명 함수를 표현하는 간결한 문법이다. 람다식은 함수를 일급 객체(first class object)로 취급하여 다른 함수의 인자로 전달하거나 함수에서 반환값으로 사용할 수 있다.

### 특징
- 메서드처럼 특정 클래스에 종속되지 않으므로 함수라고 부른다.
- 람다 표현식을 메서드 인수로 전달하거나 변수로 저장할 수 있다.
- 익명 클래스처럼 많은 자질구레한 코드를 구현할 필요 없다.


## java.util.function
- 자바에서 기본으로 제공하는 함수형 인터페이스 패키지

| 함수형 인터페이스   | 메서드 형태 | API 활용  |
| ----------------- | ---- | ---- |
| java.lang.Runnable          | void run() | 스레드의 매개 변수로 이용 |
| Consumer\<T\>       | void accept(T t) | 객체 T를 소비 |
| Supplier\<T\>       | T get() | 객체 T를 반환 |
| Function<T,R>    | R apply(T t) | 객체 T를 받아 R을 반환 |
| Predicate\<T\>      | boolean test(T t) | 객체 T를 받아 boolean을 반환 |
| Operator          | T applyAs(T t) | 매개 타입, 반환 타입이 동일 |

### 매개변수가 두 개인 인터페이스
| 함수형 인터페이스   | 메서드 형태 | 설명  |
| ----------------- | ---- | ---- |
| BiConsumer<T,U>     | void accept(T t, U u) | 두 개의 매개변수만 있고, 반환 값이 없음 |
| BiPredicate<T,U>     | boolean test(T t, U u) | 매개변수는 둘, 반환값은 boolean |
| BiFunction<T,U,R>    | R apply(T t, U u) | 두 매개변수를 받아 하나의 결과를 반환 |

- 두 개 이상의 매개변수를 갖는 함수형 인터페이스가 필요하다면 직접 만들어서 써야 한다. 만일 3개 매개변수를 갖는 함수형 인터페이스를 선언한다면 다음과 같을 것이다.


```java
@FunctionalInterface
interface TriFunction<T, U, V, R> {
	R apply(T t, U u, V v);
}
```

### UnaryOperator와 BinaryOperator
Function의 또 다른 변형으로 UnaryOperator와 BinaryOperator가 있다. 매개변수의 타입과 반환 타입이 모두 일치한다는 점이 Function과 다르다.

| 함수형 인터페이스   | 메서드 형태 | 설명  |
| ----------------- | ---- | ---- |
| UnaryOperator\<T\>     | T apply(T t) | Function<T,R>의 하위 인터페이스 |
| BinaryOperator\<T\>     | T apply(T t, T t) | BiFunction<T,U,R>의 하위 인터페이스 |


### 컬렉션 프레임워크와 함수형 인터페이스
컬렉션 프레임워크의 인터페이스에 추가된 다수의 디폴트 메서드 중 일부는 함수형 인터페이스다.

| 인터페이스   | 메서드 | 설명  |
| ----------------- | ---- | ---- |
| Collection    | boolean removeIf(Predicate\<E\> filter) | 조건에 맞는 요소를 삭제 |
| List     | void replaceAll(UnaryOperator\<E\> operator) | 모든 요소를 변환하여 대체 |
| Iterable     | void forEach(Consumer\<T\> action) | 모든 요소에 작업 action을 수행 |
| Map     | V compute(K key, BiFunction<K,V,V> f) | 지정된 키의 값에 작업 f를 수행 |
|      | V computeIfAbsent(K key, Function<K,V> f) | 키가 없으면 작업 f 수행 후 추가 |
|      | V computeIfPresent(K key, BiFunction<K,V,V> f) | 지정된 키가 있을 때 작업 f를 수행 |
|      | V merge(K key, V value, BiFunction<V,V,V> f) | 모든 요소에 병합작업 f를 수행 |
|      | void forEach(BiConsumer<K,V> action) | 모든 요소에 작업 action을 수행 |
|      | void replaceAll(BiFunction<K,V,V> f) | 모든 요소에 치환작업 f를 수행 |

- Map 인터페이스 'compute'로 시작하는 메서드는 맵의 value를 변환하고
- merge()는 Map을 병합한다.


### 기본형을 사용하는 인터페이스
지금까지 기술한 인터페이스는 매개변수와 반환 타입이 Generic이므로 기본 타입이 전달되면 Boxing이 일어난다. 따라서 기본형 타입을 처리할 때 Wrapper 클래스를 사용하는 것은 비효율적이다. 보다 효율적으로 처리할 수 있도록 기본형을 사용하는 함수형 인터페이스가 제공된다.

- Consumer


| 함수형 인터페이스   | 메서드 | 설명  |
| ----------------- | ---- | ---- |
| IntConsumer     | void accept(int value) | int 값을 받아 소비 |
| LongConsumer     | void accept(long value) | long 값을 받아 소비 |
| DoubleConsumer     | void accept(double value) | double 값을 받아 소비 |
| ObjIntConsumer\<T\>     | void accept(T t, int value) | 객체 T와 int 값을 받아 소비 |
| ObjDoubleConsumer\<T\>     | void accept(T t, double value) | 객체 T와 double 값을 받아 소비 |
| ObjLongConsumer\<T\>     | void accept(T t, long value) | 객체 T와 long 값을 받아 소비 |

- Supplier


| 함수형 인터페이스   | 메서드 | 설명  |
| ----------------- | ---- | ---- |
| BooleanSupplier     | boolean getAsBoolean() | boolean 값을 리턴 |
| DoubleSupplier     | double getAsDouble() | double 값을 리턴 |
| IntSupplier     | int getAsInt() | int 값을 리턴 |
| LongSupplier     | long getAsLong() | long 값을 리턴 |

- Function


| 함수형 인터페이스   | 메서드 | 설명  |
| ----------------- | ---- | ---- |
| DoubleFunction\<R\>     | R apply(double value) | double을 객체 R로 매핑 |
| IntFunction\<R\>     | R apply(int value) | int를 객체 R로 매핑 |
| IntToDoubleFunction     | double applyAsDouble(int value) | int를 double로 매핑 |
| IntToLongFunction     | long applyAsLong(int value) | int를 long으로 매핑 |
| LongToDoubleFunction     | double applyAsDouble(long value) | long을 double로 매핑 |
| LongToIntFunction     | int applyAsInt(long value) | long을 int로 매핑 |
| ToDoubleBiFunction<T,U>     | double applyAsDouble(T t, U u) | 객체 T, U를 double로 매핑 |
| ToDoubleFunction\<T\>     | double applyAsDouble(T t) | 객체 T를 double로 매핑 |
| ToIntBiFunction<T,U>     | int applyAsInt(T t, U u) | 객체 T, U를 int로 매핑 |
| ToIntFunction\<T\>     | int applyAsInt(T t) | 객체 T를 int로 매핑 |
| ToLongBiFunction<T,U>     | long applyAsLong(T t, U u) | 객체 T, U를 long으로 매핑 |
| ToLongFunction\<T\>     | long applyAsLong(T t) | 객체 T를 long으로 매핑 |

- Operator


| 함수형 인터페이스   | 메서드 | 설명  |
| ----------------- | ---- | ---- |
| DoubleBinaryOperator     | double applyAsDouble(double, double) | 두 개의 double을 연산 |
| DoubleUnaryOperator     | double applyAsDouble(double) | 한 개의 double을 연산 |
| IntBinaryOperator     | int applyAsInt(int, int) | 두 개의 int를 연산 |
| IntUnaryOperator     | int applyAsInt(int) | 한 개의 int를 연산 |
| LongBinaryOperator     | long applyAsLong(long, long) | 두 개의 long을 연산 |
| LongUnaryOperator     | long applyAsLong(long) | 한 개의 long을 연산 |

- Predicate


| 함수형 인터페이스   | 메서드 | 설명  |
| ----------------- | ---- | ---- |
| DoublePredicate     | boolean test(double) | double 값을 조사 |
| IntPredicate     | boolean test(int) | int 값을 조사 |
| LongPredicate     | boolean test(long) | long 값을 조사 |


## Function의 합성과 Predicate의 결합
```java
// Function
default <V> Function<T,V> andThen(Function<? super R, ? extends V> after)
default <V> Function<T,R> compose(Function<? super V, ? extends T> before)
static <T> Function<T,T> identity()

// Predicate
default Predicate<T> and(Predicate<? super T> other)
default Predicate<T> or(Predicate<? super T> other)
default Predicate<T> negate()
static <T> Predicate<T> isEqual(Object targetRef)
```

### Function의 합성
두 람다식을 합성해서 새로운 람다식을 만들 수 있다.

1. `f.andThen(g)`
- 함수 f, g가 있을 때 함수 f를 먼저 적용하고, 그 다음에 함수 g를 적용한다.
```java
Function<String, Integer> f = (s) -> Integer.parseInt(s, 16);
Function<Integer, String> g = (i) -> Integer.toBinaryString(i);
Function<String, String> h = f.andThen(g);
```

2. `f.compose(g)`
- 반대로 g를 먼저 적용하고 f를 적용한다.
```java
Function<Integer, String> g = (i) -> Integer.toBinaryString(i);
Function<String, Integer> f = (s) -> Integer.parseInt(s, 16);
Function<Integer, Integer> h = f.compose(g);
```

3. `identity()`
- 함수를 적용하기 전과 후가 동일한 항등 함수가 필요할 때 사용한다.
```java
Function<String, String> f = x -> x;
// 위의 문장과 동일
Function<String, String> f = Function.identity();
```
- 항등 함수는 잘 사용되지 않는 편이며, `map()` 으로 변환 작업할 때 변환 없이 그대로 처리하고자 할 때 사용한다.

### Predicate의 결합
- 여러 Predicate를 and(), or(), negate()로 연결해서 하나의 새로운 Predicate로 결합할 수 있다.
```java
Predicate<Integer> p = i -> i < 100;
Predicate<Integer> q = i -> i < 200;
Predicate<Integer> r = i -> i % 2 == 0;
Predicate<Integer> notP = p.negate();  // i >= 100

// 100 <= i && (i < 200 || i % 2 == 0)
Predicate<Integer> all = notP.and(q.or(r));
System.out.println(all.test(150));  // true
```

`isEqual()`은 두 대상을 비교하는 Predicate를 만들 때 사용한다. 먼저 `isEqual()`의 매개변수로 비교대상을 하나 지정하고, 또 다른 비교대상은 `test()`의 매개변수로 지정한다.

```java
// str1과 str2가 같은지 비교
boolean result = Predicate.isEqual(str1).test(str2);
```

## References
- Java의 정석
- gpt4o