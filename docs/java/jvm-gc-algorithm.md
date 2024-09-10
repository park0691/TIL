# Garbage Collection Algorithm
## Garbage Collection
Heap 영역에서 더 이상 사용하지 않는 객체를 정리하는 작업<br/>
객체의 사용 여부를 확인하기 위해 Root Set에서 참조되고 있는지를 확인하여 참조되지 않는 경우 제거한다.

### Root Set
![root set](/images/java/20240909-gc-algorithm-1.png)
_출처 : Java Performance Fundamentals / 김한도 저_

- Stack의 레퍼런스 정보
	- Local Variable Section, Operand Stack의 레퍼런스 정보
	- 현재 애플리케이션이 동작 중인 상태에서 레퍼런스하는 객체이므로 GC 되어서는 안 된다.
- Constant Pool의 레퍼런스 정보
	- 클래스가 로드된 후 유지되는 상수 풀에서 객체를 레퍼런스하는 정보로 GC 되어서는 안 된다.
- Native Method로 넘겨진 레퍼런스 정보
	- 스택의 레퍼런스 정보와 마찬가지로 네이티브 코드에서 레퍼런스하는 객체이므로 GC 되어서는 안 된다.

## Reference Counting Algorithm

객체마다 해당 객체를 참조하는 횟수인 레퍼런스 카운트를 저장한다. 해당 객체가 다른 객체에 의해 참조되는 경우 1씩 증가하고 해제되면 1씩 감소한다. 즉, 레퍼런스 카운트가 0이 되면 GC의 대상이 된다.

[장점]
- 구현이 쉽고 단순하다.

[단점]
- 카운트 관리 오버헤드
	- 객체마다 카운트를 유지해야 하며, 객체의 레퍼런스가 변경될 때마다 그 값을 업데이트해야 한다. 관리해야 할 객체가 많아지면 상당한 오버헤드 발생한다.

- 순환 참조 문제
    ![reference count](/images/java/20240909-gc-algorithm-2.png)
    _출처 : Java Performance Fundamentals / 김한도 저_
    
	- 순환 참조 구조에서는 레퍼런스 카운트가 0으로 떨어지지 않기 때문에 GC 대상이 되지 않고 메모리 누수를 유발한다.

## Mark and Sweep Algorithm
### Mark 단계
![mark phase](/images/java/20240909-gc-algorithm-3.png)
_출처 : Java Performance Fundamentals / 김한도 저_

가비지 객체를 구별하기 위해 Root Set으로부터 레퍼런스 관계가 있는 객체에 마킹한다. 마킹을 위해 주로 객체 Header의 Flag 또는 별도의 비트맵 테이블을 사용한다.

### Sweep 단계
![sweep phase](/images/java/20240909-gc-algorithm-4.png)
_출처 : Java Performance Fundamentals / 김한도 저_

마킹 정보를 활용하여 마킹되지 않은 객체를 해제한다.

[장점]
- 레퍼런스 관계가 명확하게 파악되어 순환 참조 객체들을 모두 지울 수 있다.
- 레퍼런스 관계 변경 시에 부가작업을 할 필요가 없다.

[단점]
- GC 도중에는 Mark의 정확성과 Memory Corruption 방지를 위함 Heap 사용이 제한됨 (STW)
- 단편화 발생 가능
	- 빈 공간이 있지만 단편화에 의해 할당 불가한 상황이 되어 OOM 유발

## Mark and Compaction Algorithm
Compaction 과정이 추가되었다. Compaction 단계에 Sweep 과정이 포함된다.

### Compaction 단계
![compaction phase](/images/java/20240909-gc-algorithm-5.png)
_출처 : https://medium.com/@joongwon/jvm-garbage-collection-algorithms-3869b7b0aa6f_

Sweep 이후 가비지가 차지하던 빈 공간을 살아남은 객체로 메모리 공간에 연속적으로 적재한다.

[단점]
- Compaction 이후 살아남은 객체의 레퍼런스를 업데이트하기 위해 모든 오브젝트를 액새스해야 하는 부가적인 오버헤드가 발생한다.

## Copying Algorithm
단편화를 해결하기 위한 또다른 방법
![Copying Algorithm](/images/java/20240909-gc-algorithm-6.png)
_출처 : Java Performance Fundamentals / 김한도 저_

Heap을 2개의 공간(Active, Inactive) 두 영역으로 나눈다.

Active 영역에만 객체를 할당하고, Active 영역이 꽉 차면 더 이상 할당 불가능하게 되어 GC를 수행한다. GC가 수행되면 모든 프로그램은 일단 Suspend 상태가 되어 살아남은 객체를 Inactive 영역으로 Copy 작업을 수행한다. 객체를 카피할 때 Reference 정보도 변경된다.

Copy가 끝나면 Active 영역은 가비지만 남고, Inactive 영역에는 사용 중인 객체만 남게 된다. Inactive 영역에 Copy할 때 한 쪽 방향부터 차곡차곡 적재하기 때문에 마치 Compaction 수행한 것과 같은 상태를 유지한다.
Active 영역은 모두 Free Memory가 되고 Active, Inactive 영역은 서로 바뀐다. Active, Inactive는 할당, 사용하는 공간이 Active이고 다른 대기 공간은 Inactive인 논리적인 구분이다.

[장점]
- 단편화 방지에 효과적

[단점]
- 메모리 공간을 절반 밖에 사용하지 못함
- Suspend 현상, Copy 오버헤드

## Generational Algorithm
::: warning Weak Generational Hyphothesis
1. 새로 생성된 오브젝트는 얼마 되지 않아 가비지가 되는 경우가 많다.

2. Old Object에서 Young Object로의 참조는 상당히 드물다.
:::

Copy 알고리즘을 사용하면서 대다수의 객체는 생성된 지 얼마 되지 않아 가비지가 되는 짧은 수명이라는 것과 긴 수명의 객체는 반드시 가진다는 경험적 체득을 통해 고안된 알고리즘이다. 이를 Weak Generational Hyphothesis 라 한다.

특히 수명이 긴 객체는 Copying Algorithm에 의해서 두 영역을 계속 왔다갔다 하는데 GC 대상이 되지 않기 때문에 비효율적이다.

다음과 같이 Heap을 Age 별로 몇 개의 Sub Heap으로 나눈다.

![Copying Algorithm](/images/java/20240909-gc-algorithm-7.png)
_출처 : Java Performance Fundamentals / 김한도 저_

- Young Gen은 Mark and Sweep Algorithm, Promotion 과정에서는 Copy Algorithm과 유사하다.
- 최초 생성된 객체는 Young Gen Sub Heap에 할당되며, Mark 단계 거치는 동안 Reachable, Garbage 객체가 구분된다.
- Mark된(사용 중, 레퍼런스되는) 객체는 Age가 증가한다.
	- Age가 일정 임계값을 넘은 객체(Matured)는 Old Gen Sub Heap으로 Promotion된다.
	- Promotion 될 정도의 Age 되지 않은 객체는 Young Gen에 남으며, Garbage 객체는 Sweep 된다.

이 알고리즘을 토대로 Copying 알고리즘의 오버헤드, 메모리 활용 문제를 극복할 수 있었고, 각 영역에 대해서 적절한 알고리즘을 선택할 수 있게 되었다.

## Hotspot JVM의 Garbage Collection
### Heap 구조
![Copying Algorithm](/images/java/20240909-gc-algorithm-8.png)
_출처 : https://inpa.tistory.com/entry/JAVA-%E2%98%95-%EA%B0%80%EB%B9%84%EC%A7%80-%EC%BB%AC%EB%A0%89%EC%85%98GC-%EB%8F%99%EC%9E%91-%EC%9B%90%EB%A6%AC-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%F0%9F%92%AF-%EC%B4%9D%EC%A0%95%EB%A6%AC_

- Old Generation은 한 영역으로만 구성되어 있다.
- Young Generation
	- Eden 영역
		- 새로 생성된 객체가 최초로 저장되는 공간
	- Survivor 영역(S1, S2)
		- GC 수행될 때마다 객체의 이동 방향이 매번 바뀐다.

### Minor GC (Young Generation GC)
- Young Generation은 Generation Algorithm을 사용한다.

![minor gc](/images/java/20240909-gc-algorithm-9.png)
_출처 : Java Performance Fundamentals / 김한도 저_

[동작 과정]
1. Eden 영역이 꽉 차면 Minor GC가 시작된다. 애플리케이션은 Suspend 된다.
2. Mark 단계를 통해 Reachable 객체를 찾는다.
	- 가비지 컬렉터는 Eden 영역, 점유 중인 Survivor(S1, S2 중 사용 중인 영역, From)을 스캔한다.
3. Reachable 객체는 Survivor(S1, S2 중 비어 있는 영역, To)으로 이동한다.
	- 객체의 이동 방향 : Eden, From -> To
	- Survivor 두 영역을 From, To로 나누는 것은 논리적인 방향성에 기인한다. 항상 Eden, From 영역으로부터 To 영역으로 객체가 이동한다. GC가 끝나면 From, To가 서로 뒤바뀐다.
	- Age가 일정 임계값을 넘은 객체(Matured)는 Old Generation으로 Promotion된다.
4. Garbage 객체의 메모리를 해제한다.
5. 살아 남은 Reachable 객체들은 Age 값을 1 증가시킨다.
6. 애플리케이션은 Suspend 풀고 실행을 재개한다.

### Major GC (Old Generation GC)
Old Generation의 GC는 자주 발생하지 않지만 발생 시 Minor GC보다 Suspend 시간이 더 길다. Old Generation의 크기가 Young Generation보다 더 크게 설정되기 때문이기도 하지만, GC 수행 방식에도 차이가 있다.

Old Generation은 Mark and Compaction Algorithm을 사용한다. Generational Algorithm에 비해 Garbage를 Sweep, Compaction 하는데 많은 시간이 소요된다.

Promotion이 여러 번 수행되어 Old Generation이 꽉 차면 Major GC가 발생한다.


## References
- Java Performance Fundamentals / 김한도 저
- https://medium.com/@joongwon/jvm-garbage-collection-algorithms-3869b7b0aa6f
- https://inpa.tistory.com/entry/JAVA-%E2%98%95-%EA%B0%80%EB%B9%84%EC%A7%80-%EC%BB%AC%EB%A0%89%EC%85%98GC-%EB%8F%99%EC%9E%91-%EC%9B%90%EB%A6%AC-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%F0%9F%92%AF-%EC%B4%9D%EC%A0%95%EB%A6%AC