# Map
![images](/images/java/20250509-collections-map-3.png)

- `key-value` 형태로 데이터를 저장한다.
    - `key`중복 불가 (`key`는 Map에서 고유한 값)
    - `value`중복 가능
- `java.util.Collection`을 직접 구현하지 않지만, 맵의 데이터를 컬렉션 뷰로 변환해 Set과 Collection 처럼 처리할 수 있는 방법을 제공한다.
- `Hashtable, HashMap`은 <u>'키에 대한 해시 값을 사용하여 값을 저장하고 조회하며, 키-값 쌍의 개수에 따라 동적으로 크기가 증가하는 `associate array`’</u>라 정의할 수 있다. ‘`associate array`’를 지칭하는 다른 용어는 대표적으로 ‘Map, Dictionary, Symbol Table’ 등이다.

::: tip
적은 연산으로 빠르게 동작하는 완전한 해시 함수가 있더라도 HashMap에서 사용할 수 없다. HashMap에서 호출하는`hashCode()`의 반환 타입은 `int`다. 32비트 정수 자료형으로 완전한 해시 함수를 만들 수 없다. 논리적으로 생성 가능한 객체의 수가 2^32 보다 더 많기 때문이다.(→ 각 객체의 해시 코드가 유일하지 않은 이유) 또한 모든 HashMap에서 O(1)을 보장하기 위해 랜덤 액세스가 가능하게 하려면 원소가 2^32개인 배열을 모든 HashMap이 가지고 있어야 하기 때문이다.

따라서 HashMap을 비롯한 `associate array` 구현체에서는 메모리를 절약하기 위해 실제 해시 함수의 표현 정수 범위 N보다 작은 M개의 원소가 있는 배열만을 사용한다. 따라서 다음과 같이 객체에 대한 해시 코드의 나머지 값을 해시 버킷 인덱스 값으로 사용한다.

```java
int index = X.hashCode() % M;
```
서로 다른 해시 코드를 가지는 서로 다른 객체가 1/M 확률로 같은 해시 버킷을 사용하도록 한다. (해시 충돌을 분산시키기 위함)
:::

## Collection View
- Map의 키, 값, 키-값 쌍을 다른 형태의 컬렉션(Set 또는 Collection)으로 반환해 주는 메소드를 말한다.
- 실제 Map과 동기화되어 Collection View에서 수행한 변경 사항은 실제 Map에 반영된다.
- 메서드
    - `Set<K> keySet()` : Map에 저장된 모든 키를 Set으로 반환한다.
        ```java
        Map<String, Integer> map = new HashMap<>();
        map.put("apple", 1);
        map.put("banana", 2);
        map.put("cherry", 3);
        System.out.println("Map before removal: " + map);
        
        // Map의 키들을 Set으로 반환
        Set<String> keySet = map.keySet();
        System.out.println("Keys: " + keySet);
        
        // Set에서 키를 제거하면 Map에서도 해당 항목이 삭제됨
        keySet.remove("banana");
        // Map after removal: {apple=1, cherry=3}
        System.out.println("Map after removal: " + map);
        ```
        
    - `Collection<V> values()` : Map에 저장된 모든 값을 Collection으로 반환한다. 반환된 Collection은 중복 값을 허용하며, 값만을 기준으로 다룬다. 이 컬렉션도 Map과 연결되어 값을 제거하거나 변경할 수 있다.
        ```java
        Map<String, Integer> map = new HashMap<>();
        map.put("apple", 1);
        map.put("banana", 2);
        map.put("cherry", 3);
        
        // Map의 값들을 Collection으로 반환
        Collection<Integer> values = map.values();
        System.out.println("Values: " + values);
        
        // Collection에서 값을 제거하면 Map에서 해당 값과 연결된 키가 제거됨
        values.remove(2);
        // Map after value removal: {apple=1, cherry=3}
        System.out.println("Map after value removal: " + map);
        ```
        
    - `Set<Map.Entry<K, V>> entrySet()` : Map의 key-value 쌍(Entry)을 Set으로 반환한다. 이 엔트리를 통해 키와 값을 동시에 처리할 수 있다.
      
        ```java
        Map<String, Integer> map = new HashMap<>();
        map.put("apple", 1);
        map.put("banana", 2);
        map.put("cherry", 3);
        
        // Map의 키-값 쌍을 Set으로 반환
        Set<Map.Entry<String, Integer>> entrySet = map.entrySet();
        System.out.println("Entries: " + entrySet);
        
        // 엔트리 값을 수정하면 Map의 값도 수정됨
        for (Map.Entry<String, Integer> entry : entrySet) {
            if (entry.getKey().equals("apple")) {
                entry.setValue(10);
            }
        }
        // Map after modification: {banana=2, apple=10, cherry=3}
        System.out.println("Map after modification: " + map);
        ```
## HashMap
- `Hashtable`을 발전시켜 Java 2부터 지원하게 된 클래스
- 해싱을 사용하므로 많은 양의 데이터를 검색하는데 뛰어난 성능 - 해시맵의 핵심!!
    - 키의 해시코드를 사용하여 데이터의 저장 위치(해시 버킷의 인덱스)를 결정하므로 데이터 추가, 검색, 삭제 등의 작업을 빠르게 수행
- `null`값이 올 수 있다. (`null` 키 하나, `null` 값 여러 개 허용)
- `key-value`를 각각 `Object`타입으로 저장한다.
- `HashMap`에 담을 데이터의 개수가 많은 경우에는 초기 크기 지정을 권장한다. (불필요한 리해싱 작업 줄이기 위해)
- 순서 보장 X
    - 데이터 저장 순서에 관계 없이 키의 해시코드에 따라 데이터가 저장된다. 데이터의 빠른 접근을 목적으로 설계되었기 때문에 순서 유지가 주 목적이 아니다.
- 성능 최적화를 위해서 적절한 초기 용량, 로드 팩터 설정 중요
- 시간 복잡도
    - 해시 충돌이 발생하지 않는 경우 해시 테이블의 탐색, 삽입, 삭제 연산은 O(1) 에 실행되지만, 충돌이 발생하는 경우 탐색, 삭제 연산은 O(K) 만큼 걸린다.

::: warning Hashtable과의 차이점
![images](/images/java/20250509-collections-map-1.png)

- HashMap은 동기화되지 않기 때문에 멀티스레드 환경에서는 `Collections.synchronizedMap()`이나 `ConcurrentHashMap` 등을 써야 한다.
- Hashtable은 모든 메서드가 `synchronized`로 보호되어 스레드 안전하지만 성능이 떨어짐
- HashMap은 `null` 허용하지만, Hashtable은 `null` 허용하지 않는다.
- 저장된 요소를 순회할 때 Hashtable은 `Enumeration(Fail-Safe Iteration)`을 HashMap은 `Iterator(Fail-Fast Iteration)`를 통해 순회한다.
    - HashMap은 Iteration을 처리하는 도중 데이터를 삭제하는 안전한 방법을 제공하지만 Hashtable은 제공하지 않는다.
- HashMap은 보조 해시를 사용하기 때문에 Hashtable에 비해 해시 충돌이 덜 발생할 수 있어서 상대적으로 성능상 이점이 있다.
:::

### identity, equality
#### identity
- 동일한 것의 관계
- `x`와 `y`가 동일한 객체인지 비교한다.
- 객체의 내용이 같아도 레퍼런스가 다르면, 다른 객체로 판단한다.
- `==` 연산자로 비교한다.

#### equality
- 동일한 값을 갖는 관계
- `x`와 `y`가 의미적/논리적으로 같은지 비교한다.
- 레퍼런스가 다르더라도 객체의 내용이 같으면, 같은 객체로 판단한다.
- `equals()` 메소드로 객체 내부 값을 비교한다.
    - 단, `Object.equals()` 메소드는 `==`와 같이 레퍼런스로 비교한다.
    - 동일한 객체가 메모리에 여러 개 있는 경우가 있기 때문에 동등성 비교를 위해 각 클래스는 `equals()` 메소드를 오버라이딩한다.
- primitive data type 인 경우 `==`로 비교 가능하다.
    - 변수 선언부는 Java Runtime Data Area의 Stack에 저장되고, 해당 변수에 저장된 상수는 Runtime Constant Pool 에 저장된다.
    - Stack의 변수 선언 부는 Runtime Constant Pool의 주소 값을 가지게 되고, 만약 다른 변수도 같은 상수를 저장하고 있다면, 이 다른 변수도 같은 Runtime Constant Pool의 주소값을 가지기 때문에, 엄밀히 말하면 primitive type 역시 주소값 비교가 된다.

::: tip assignment(==), equality, equals() 차이점
assignment(`==`)는 객체의 레퍼런스가 같은지 비교하고(identity 체크), equality는 객체가 의미적으로 같은지 비교한다. 따라서 equality는 레퍼런스가 다르더라도 두 객체의 속성과 타입이 같으면 같다고 판단한다. equals()는 equality를 판단하기 위해 구현하는 메소드다.
:::

### hashCode()와 equals()
둘 다 `Object` 클래스에 정의되어 있다.

#### hashCode()
- 객체가 가지는 고유 값을 반환
- `Object`의 기본 구현은 객체 메모리 주소 기반으로 해시코드 생성 (모든 객체에 대해 `hashCode()` 반환값은 유일함)
```java
public native int hashCode();
```
- 객체를 해시 기반 자료구조(예: `HashMap`, `HashSet`)에 사용할 때, 객체를 빠르게 찾기 위해 해시코드를 사용한다.
- Object 명세 규약 특징
    - `equals()`메소드가 같다고 판단한 두 객체의 해시 코드 값은 같아야 한다.
        - `equals()`를 오버라이딩하면, `hashCode()`도 **항상 같이** 오버라이딩해야 한다. (`equals()`가 true 반환하는 두 객체는 반드시 `hashCode()`도 같아야 한다.)
    - `equals()`메소드가 다르다고 판별한 두 객체의 해시 코드 값이 반드시 같을 필요는 없다.
        - 단, 같지 않은 객체들이 각기 다른 해시 코드 값을 가지면 해시 테이블의 성능은 향상됨

::: tip Objects.hash() 메서드
매개변수로 주어진 값으로 고유한 해시 코드를 생성한다. 즉, 동일한 값을 가지는 객체의 필드로 해시 코드를 생성하면 동일한 해시 코드 가진다. 보통 클래스의 `hashCode()`를 재정의할 때 리턴값을 생성하기 위해 사용한다.
:::

::: tip identityHashCode 메서드
`equals()` 메서드와 `hashCode()` 메서드를 오버라이딩하면, 객체 필드를 기반으로 해싱하기 때문에 객체 자체의 주소 기반 해시코드가 필요한 경우 난감할 수 있다. 그래서 자바에서 똑같이 해시코드를 반환해 주는 `System.identityHashCode()`가 존재한다. 즉, `hashCode()` 오버라이딩했는데, 오버라이딩 전의 기능이 필요할 때 사용한다. 즉 해당 메서드는 모든 객체에 대해 항상 다른 해시 코드값을 반환한다.
:::

#### equals()
- 객체의 내용으로 두 객체가 논리적으로 같은지 비교한다.
- `Object`의 기본 구현은 `==` 연산자(즉, 동일한 참조인지) 기반으로 비교
```java
public boolean equals(Object obj) {
    return (this == obj);
}
```
::: tip Wrapper 클래스가 아닌 오브젝트를 담은 Set, Map 컬렉션의 객체 중복 검사
![images](/images/java/20250509-collections-map-2.png)

- `hashCode()`반환 값이 다르면 다른 객체로 판단하고, 같으면 `equals()`로 다시 비교한다.
- 즉, 해시 코드가 다른 엔트리끼리는 동등성 비교 시도 조차 하지 않는다.
:::

::: tip hashCode(), equals() 작성 가이드라인
- hashCode와 equals를 생성하기 위해서는 같은 attribute를 이용해야 한다.(e.g. Employee id)
- equals는 일관되어야 한다. 즉, 객체가 수정되지 않았다면 항상 결과가 동일해야 한다.
- a.equals(b) == true이면, a.hashCode() == b.hashCode() 역시 true여야 한다.
- 두 메소드는 항상 함께 오버라이드 되어야 한다.
:::

### Hash Collision 해결
해시 충돌을 해결하기 위해 같은 버킷에 여러 개의 데이터를 리스트로 연결하는 ‘Separate Chaining’을 사용한다.

**[삭제 연산의 간편함]**

Open Addressing 방식은 값을 삭제한 후에도 탐색 경로를 유지해야 하기 떄문에 삭제됬음을 표시하는 특별한 마커가 필요하여 구현이 복잡함. 반면 Separate Chaining 방식은 단순히 연결 리스트나 트리에서 해당 엔트리를 제거하면 끝나므로 삭제 처리가 매우 간단하다.

**[성능 저하 없이 높은 Load Factor 허용]**

Open Addressing 방식은 해시 테이블이 차면 성능이 급격히 떨어진다. (탐색 비용의 증가) 반면, Separate Chaining 방식은 Load Factor (부하율)이 높아도 테이블 자체는 두고 해당 버킷 내부만 탐색하면 되므로 성능 저하가 상대적으로 적은 편.

#### Red-Black Tree 변환
Java 7까지는 Separate Chaining에서 링크드 리스트를 고정적으로 사용했지만, Java 8부터 데이터의 개수가 일정 수준 이상이 되면 Red-Black Tree로 변환하여 검색 속도를 개선한다.

링크드 리스트에서 조회 시간 복잡도가 O(N/M)을 보여줬지만 트리에서는 O(log N/M) 복잡도를 가진다. 따라서 데이터 개수가 일정 이상일 때 링크드 리스트 대신 트리를 사용하는 것이 성능상 좋다.

::: warning 링크드 리스트 또는 트리 사용의 기준
해시 버킷에 할당된 키-값 쌍의 개수에 따라 정한다.

```java
static final int TREEIFY_THRESHOLD = 8;
static final int UNTREEIFY_THRESHOLD = 6;
```

하나의 해시 버킷에 8개(***TREEIFY_THRESHOLD***)의 키-값 쌍이 모이면 링크드 리스트를 트리로 변환한다. 만약 해당 버킷의 데이터를 삭제하여 개수가 6개(***UNTREEIFY_THRESHOLD***)에 이르면 다시 링크드 리스트로 변경한다.

트리는 링크드 리스트보다 메모리 사용량이 많고 데이터의 개수가 적을 때 트리와 링크드 리스트 사이의 큰 성능 차이가 없기 때문이다. 8과 6으로 2 이상의 차이를 둔 것은, 만약 차이가 1이라면 어떤 한 키-값 쌍이 반복되어 삽입/삭제되는 경우 불필요하게 트리와 링크드 리스트의 변경이 반복되어 성능이 저하될 수 있기 때문이다.
:::

### Capacity와 Load Factor
- 성능 최적화를 위해서 적절한 초기 용량, 로드 팩터 설정은 중요하다. (불필요한 리해싱 작업 줄이기 위해)
- Capacity : hash의 총 길이, 해시 테이블 버킷 개수
    - Capacity가 너무 작으면 Key-Value 추가될 때마다 링크드 리스트 길어질 확률 높다. (Hash로 값 찾는 시간 길어질 확률 높아져)
- Load Factor : 적재율
    - 키 개수를 K, 해시 테이블 크기를 N이라 할 때 Load Factor(적재율)은 K/N
    - 해시 테이블 크기에 대한 키 개수의 비율 (Capacity 중 얼마나 사용 중인가?)
    - HashMap의 용량을 늘릴 시점을 결정한다.
        - Load Factor(적재율)을 초과하면 해시 테이블의 리사이징을 고려한다.
    - 높은 Load Factor은 공간을 절약할 수 있지만, 탐색 비용을 높인다.
- In Java, Capacity = 16, Load Factor = 0.75 is default settings. 최대 버킷의 개수(Maximum Capacity)는 2^30개

### Rehashing
HashMap은 상수 시간 복잡도 안에 저장, 삭제, 탐색 지원을 목표하지만, 고정된 크기의 해시맵에서 데이터의 수가 증가하면 해시 충돌이 발생하여 성능히 저하될 수 밖에 없다. 따라서 성능을 유지하기 위해 HashMap 크기를 확장해야 한다.

HashMap은 키-값 쌍 데이터 개수가 일정 개수 이상(Load Factor / 임계값 초과)이 되면 해시 버킷을 두 배로 늘리는 rehashing 작업을 수행한다.

⇒ 해시 버킷의 수를 늘리면 N/M 값도 작아져 해시 충돌로 인한 성능 손실 문제 해결

> **예를 들어**<br/>
> Capacity * Load Factor 로 임계값을 얻을 수 있다. default 임계값은 16 * 0.75 = 12 이므로 데이터가 12개 초과하여 13개 저장될 때 HashMap의 용량을 늘린다.

#### 오버헤드
rehashing은 모든 키-값 데이터를 읽어 새로운 메모리 공간에 배치해야 하므로 큰 비용이 발생한다.

따라서 큰 용량의 데이터가 들어올 것으로 예상된다면 처음부터 큰 HashMap을 생성하는 것(생성자로 초기 해시 버킷 개수 지정)이 불필요한 rehashing 발생을 감소시키는 것이 효율적이다.

#### 보조 해시 함수
해시 버킷 크기를 두 배로 확장하면 해시 버킷의 개수 M은 2^a 형태가 되기 때문에 `index = X.hashCode() % M`을 계산할 때 `X.hashCode()`의 하위 a개의 비트만 사용한다. 따라서 해시 함수가 32 비트 영역을 고르게 사용하도록 만들었다 하더라도 해시값을 2의 승수로 나누면 해시 충돌이 쉽게 발생할 수 있다. (해시값이 특정 영역에 몰리는 문제)

보조 해시 함수는 키의 해시값을 변형하여 해시 충돌 가능성을 줄인다. (해시값을 균일하게 분포시키기 위해) 보조 해시 함수는 JDK 1.4에 처음 등장하였고, Java 5 ~ 7까지는 같은 방식의 보조 해시 함수를 사용하고 Java 8부터 다시 새로운 방식의 보조 해시 함수를 사용하고 있다.

`index = X.hashCode() % M`을 계산할 때 사용하는 M 값은 소수일 때 index 값 분포가 가장 균등할 수 있다. 그러나 M 값이 소수가 아니기 때문에 별도의 보조 해시 함수를 사용하여 index 값 분포를 균등하게 만들어야 한다.

**[Java 7 HashMap의 보조 해시 함수]**
```java
final int hash(Object k) {  
    // Java 7부터는 JRE를 실행할 때, 데이터 개수가 일정 이상이면
    // String 객체에 대해서 JVM에서 제공하는 별도의 옵션으로
    // 해시 함수를 사용하도록 할 수 있다.
    // 만약 이 옵션을 사용하지 않으면 hashSeed의 값은 0이다.
    int h = hashSeed;
    if (0 != h && k instanceof String) {
        return sun.misc.Hashing.stringHash32((String) k);
    }
    h ^= k.hashCode();
    // 해시 버킷의 개수가 2a이기 때문에 해시 값의 a비트 값만을 
    // 해시 버킷의 인덱스로 사용한다. 따라서 상위 비트의 값이 
    // 해시 버킷의 인덱스 값을 결정할 때 반영될 수 있도록
    // shift 연산과 XOR 연산을 사용하여, 원래의 해시 값이 a비트 내에서 
    // 최대한 값이 겹치지 않고 구별되게 한다.
    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
```
**[Java 8 HashMap의 보조 해시 함수]**
```java
static final int hash(Object key) { int h; return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16); }  
```
상위 16비트 값을 XOR 연산하는 매우 단순한 형태의 보조 해시 함수를 사용한다.

- Java 8에서는 해시 충돌이 많이 발생하면 링크드 리스트 대신 트리를 사용하므로 해시 충돌 시 발생할 수 있는 성능 문제가 완화되었기 때문이다.
- 최근의 해시 함수는 균등 분포가 잘 되게 만드는 경향이 많아, Java 7까지 사용했던 보조 해시 함수의 효과가 크지 않기 때문이다. 이 이유가 좀 더 결정적인 원인이 되어 Java 8에서는 보조 해시 함수의 구현을 바꾸었다.

개념상 해시 버킷 인덱스를 계산할 때에는 `index = X.hashCode() % M`처럼 나머지 연산을 사용하는 것이 맞지만, M값이 2a일 때는 해시 함수의 하위 a비트 만을 취한 것과 값이 같다. 따라서 나머지 연산 대신 `1 << a – 1` 와 비트 논리곱(AND, &) 연산을 사용하면 훨씬 더 성능이 좋다.

## Hashtable
- `HashMap`와 같은 동작을 하는 클래스
- `null` 저장 불가
- `thread-safe` 하다.
    - `synchronized`로 동기화 처리 되어 있어 blocking 후 unblock 될 때까지 기다려야 되기 때문에 HashMap에 비해 성능상 느리다.
- 기존 코드와의 호환성을 위해서만 남아있으므로 `HashMap` 사용하는 것이 좋다. (레거시 클래스다)

## TreeMap
- ??

## LinkedHashMap
- 입력된 순서대로 데이터가 출력된다.

## WeakHashMap

## References
- https://mangkyu.tistory.com/101
- https://inpa.tistory.com/entry/JAVA-%E2%98%95-equals-hashCode-%EB%A9%94%EC%84%9C%EB%93%9C-%EA%B0%9C%EB%85%90-%ED%99%9C%EC%9A%A9-%ED%8C%8C%ED%97%A4%EC%B9%98%EA%B8%B0