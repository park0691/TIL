# Garbage Collector
## Serial GC
- Young Gen에서 Generational Algorithm, Old Gen에서 Mark and Compaction Algorithm을 사용한다.
- 서버의 CPU 코어 하나를 사용하여 처리하는 방식으로 1개 스레드만 이용하여 GC 처리한다.

IT 환경이 급변하며 Heap 사이즈가 커짐에 따라 Suspend 문제는 더 두드러지게 되었다. 

## Parallel GC
이 문제를 해결하기 위해 모든 리소스를 투입하여 GC를 빨리 끝내자는 전략이 나왔다. 대용량 Heap에 적합한 전략으로 Garbage Collector는 병렬 처리를 수행하는 방법을 채택한 Parallel GC가 나왔다. 이러한 컬렉터를 Throughput Collector라고 부른다.

![parallel-gc](/images/java/20240910-garbage-collector-1.png)
_출처 : Java Performance Fundamentals / 김한도 저_

- Java 8의 default GC
- Serial GC와 기본적인 알고리즘은 같지만 Young Gen의 GC를 멀티 스레드로 수행한다.
- 많은 리소스를 투입하여 동시에 수행하므로 Suspend 시간이 단축된다.

## Parallel Old GC, Parallel Compacting Collector
Young Gen의 Suspend 시간 단축 효과를 본 Parallel Algorithm을 Old Gen에도 적용한다.

- Parallel GC 개선
- Young Gen 뿐만 아니라 Old Gen의 GC도 멀티 스레드로 수행한다.

## CMS GC, Concurrent Mark-Sweep Collector
Young Gen은 Parallel Copy Algorithm을 사용하고, Old Gen은 Concurrent Mark-and-Sweep Algorithm을 사용한다. 애플리케이션 스레드와 GC 스레드가 동시 실행되어 Suspend 최소화한다. Parallel GC와 큰 차이점은 Compaction을 수행하지 않는다는 것이다.

![cms-gc](/images/java/20240910-garbage-collector-2.png)
_출처 : https://d2.naver.com/helloworld/1329_

[장점]
- 애플리케이션의 Suspend 시간이 짧으며 Compaction을 수행하지 않아 GC 중에도 최대한 애플리케이션의 수행을 보장한다.

[단점]
- 다른 GC 방식보다 메모리와 CPU를 더 많이 사용한다.
	- GC 대상의 식별 작업이 복잡한 여러 단계로 수행, Concurrent 작업 수행되어 다른 GC 대비 오버헤드가 크다.
- 반복된 Sweep으로 Heap의 단편화가 발생할 수 있다. (Compaction 수행하지 않으므로)
	- Free List 사용하더라도 Young Generation의 오버헤드 증가
- 애플리케이션과 병행하여 GC 수행하므로 가비지를 정확하게 수집하지 못하는 Floating Garbage가 발생할 수 있다.

### 동작 과정, Concurrent Mark-Sweep Algorithm
1. Initial Mark<br/>
	Root Set에서 직접 레퍼런스 되는 (가장 가까운) 객체만 찾아낸다.<br/>
	싱글 스레드만 사용되는 Serial Phase이며, <u>Heap은 Suspend 상태</u>가 된다. 그러나 Root Set에서 직접 레퍼런스되는 객체만 찾아내기 때문에 Suspend 시간은 매우 짧다.

2. Concurrent Mark<br/>
	앞 단계에서 직접 레퍼런스된 객체들을 따라가며 추적하여 레퍼런스되는 객체들을 찾아낸다.<br/>
	싱글 스레드만 사용되는 Serial Phase이지만 다른 스레드들과 동시에 수행된다.

3. Remark<br/>
	유일한 Parallel Phase로 모든 스레드가 GC에 동원되기 때문에 <u>애플리케이션은 잠시 중단</u>된다. Concurrent Mark 단계에서 새로 추가되거나 참조가 끊긴 객체를 다시 확인한다. 이미 마킹된 Object를 다시 추적하여 Live 여부를 확정한다.

4. Concurrent Sweep<br/>
	Serial Phase로 다른 스레드들이 실행되고 있는 상태에서 참조가 끊긴 객체의 할당을 해제한다. Sweep 작업만 수행할 뿐 Compaction 작업은 수행하지 않는다.

::: tip CMS GC는 왜 Compaction 안 하나?
STW 시간을 줄이기 위함이다. CMS GC는 GC 작업을 애플리케이션과 동시에 수행하여 STW 시간을 최소화하려고 한다. 그러나 Compaction 작업은 객체를 이동시켜야 하기 때문에 애플리케이션이 중단되어야 하므로 Compaction을 수행하지 않는다. 발생할 수 있는 단편화 문제를 극복하기 위해 Free List 기법을 사용한다.
:::

::: warning Free List
CMS GC에서 메모리 할당 시 사용할 수 있는 해제된 메모리 블록들의 리스트를 말한다.<br/>
객체가 삭제되면 해당 메모리 블록이 Free List에 추가되어, 추후 메모리 재할당 시 최대한 Promotion된 객체와 크기가 비슷한 Free Space를 Free List에서 탐색한다.
또한 Promotion되는 객체의 사이즈를 통계화하여 미래의 요구량을 추정하고, 추정한 요구량에 따라 Free Memory 블록을 쪼개거나 붙여서 적절한 사이즈의 Free Memory Chunk에 객체를 할당한다.<br/>
그러나 이러한 작업은 Young Gen의 부담을 준다. 자신에게 적합한 크기의 메모리 공간을 탐색하는 과정이 추가되므로 Old Gen의 할당에 시간이 오래 걸린다.
:::

### Floating Garbage 문제
Concurrent Mark 단계에서 새롭게 Old Gen에 생성된 객체가 Concurrent Mark 단계가 끝나기 전에 참조 관계가 끊어져 GC되지 못하는 Dead Object를 `Floating Garbage`라 한다.

![floating garbage](/images/java/20240910-garbage-collector-8.png)
_출처 : Java Performance Fundamentals / 김한도 저_

CMS GC는 애플리케이션과 병행(Concurrent)하여 GC 작업을 수행하므로 GC 도중 애플리케이션은 객체를 생성하거나 참조를 변경할 수 있다.

위 그림 Concurrent Mark 단계에서 `Object E - 5`, `Object F - 6`이 새로 Promotion되어 등장한다. 그러나 CMS Collector에서는 Initial Mark 단계에서 마킹된 Object만 GC 대상이 되기 때문에 이들은 GC 대상에서 제외된다. (그림의 Heap 내 둥근 모서리 영역이 GC 대상임을 표시한다)

두 객체 중 `Object E - 5`와 같이 Promotion 되자마자 참조 관계가 끊어져 Concurrent Mark 단계가 끝나기 전에 Dead Object가 된 객체를 `Floating Garbage`라 한다. 이 `Floating Garbage`는 다음 번 GC에서 해제된다.

`Floating Garbage`의 존재는 GC 완료 시점까지도 Garbage가 완벽하게 제거되지 않음을 뜻하고 다음 GC 주기까지 해제되지 않으므로 메모리 자원을 낭비하게 한다. 또한 메모리를 완전히 회수하지 못하기 대문에 Heap이 빨리 소모되어 GC를 더 자주 발생시킨다.


## G1 GC, Garbage First Collector
![g1-gc](/images/java/20240910-garbage-collector-3.png)
_출처 : https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html_

Garbage First라는 이름은 Garbage로만 꽉 차있는 Region부터 먼저 정리를 시작한다 해서 붙게 되었다. 이전 GC와는 달리 Heap 전체를 탐색하지 않고 Region 단위로 탐색하여 Garbage가 많은 영역이 GC 대상이 된다.

G1 GC는 CMS GC를 개선하여 대용량 메모리 애플리케이션의 성능을 향상시키기 위해 설계되었다.<br/>
STW 시간을 최소화하면서 가능한 처리량을 높이는 것을 목표로 한다.<br/>
일부 동작은 처리율을 높이기 위해 항상 STW를 발생시키고, Heap 전체 global marking과 같이 오래 걸리는 작업은 애플리캐이션과 병렬 수행한다. STW 시간을 최소화하기 위해 G1 GC는 단계별로 병렬 수행하며 STW 시간을 최소화하여 메모리 공간을 확보한다.

- Java 9의 default GC
- 큰 메모리에서 사용하기 적합한 GC, 대규모 Heap 사이즈에서 짧은 GC 시간을 보장한다.
- 물리적인 Young / Old Generation 구분을 없애고 Heap을 균등한 Region으로 분할하고 각 Region에 동적으로 Eden, Survivor, Old 역할을 동적으로 부여한다.
	- 더 이상 각 Generation을 구성하는 메모리를 연속해서 배치할 필요 없다.
	- Suspend Time(STW)의 분산
	- 런타임에 G1 GC가 필요에 따라 영역별 Region 개수를 튜닝한다. → STW 최소화
	
- Humongous Region의 추가
    - Region 크기의 1/2을 초과하는 객체를 저장


### 동작 과정, GC Cycle
![g1-gc](https://docs.oracle.com/en/java/javase/17/gctuning/img/jsgct_dt_001_grbgcltncyl.png)
_출처 : https://docs.oracle.com/en/java/javase/17/gctuning/garbage-first-g1-garbage-collector1.html_

기본적으로 G1 GC는 Young Only Phase와 Space Reclamation 단계를 반복하면서 수행하는 사이클 구조로 진행된다.

1. Young Only Phase
![g1-gc](/images/java/20240910-garbage-collector-4.png)
_출처 : https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html_

- Young GC (Minor GC, Evacuation Phase)<br/>
Young Generation Region 대상으로 레퍼런스되는 객체를 찾아낸 후 Survivor 또는 Old Region으로 카피한다. 기존 Young Generation Region은 해제된다. 이후 Young Region은 Survivor 근처의 비어 있는 Region이 된다. (Young Generation의 물리적인 위치는 계속 변한다.)<br/>
Young GC는 멀티 스레드로 병렬 수행된다.

- Old GC (Major GC)<br/>
Eden 영역이 가득 차면 Young GC만 주기적으로 수행되며, Old Generation의 점유율이 `Initial Heap Occupancy Percent` 임계값에 도달할 때 Concurrent Start 단계가 시작된다.

**[Concurrent Start]**
- Concurrent Mark
![g1-gc](/images/java/20240910-garbage-collector-5.png)
_출처 : https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html_

    - Young GC, 애플리케이션과 병행 수행되며, 다음 Space Reclamation Phase에서 유지할 객체를 찾기 위해 Old Generation Region에서 Reachable 객체를 찾아낸다.

- Remark
![g1-gc](/images/java/20240910-garbage-collector-6.png)
_출처 : https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html_

    - Marking을 끝내고 전역 레퍼런스 처리, 클래스 언로딩, 완전히 빈 Region의 해제(Concurrent Mark에서 X 표시한 Region의 해제), 내부 데이터 구조를 정리하며 STW 발생한다.
    - G1 GC는 Old Region에서 여유 공간을 회수할지 결정할 수 있도록 정보를 계산한다. 이 계산은 Cleanup 단계에서 끝난다.

- (Copying / ) Cleanup
  ![g1-gc](/images/java/20240910-garbage-collector-7.png)
  _출처 : https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html_

	- STW 발생하며, Live Object 비율이 낮은 Region을 우선 해제하기 위해 해당 Region의 Live Object를 다른 영역으로 Evacuate(Copy)한 후 GC한다. → G1 GC는 Garbage가 많은 Region부터 정리하여 여유 공간을 신속하게 확보한다.
    - Space Reclamation Phase 수행할지 결정한다. (Old Region을 회수할지 결정) 이후 다시 Young Only Phase가 수행될 수도 있고, Space Reclamation Phase가 수행될 수도 있다.

2. Space Reclamation Phase
- Young, Old Region 구분 없이 Heap의 GC를 수행하는 Mixed GC로 구성된다.

::: warning Mixed GC
Young Generation과 Old Generation의 일부 Region을 함께 정리하는 GC
G1 GC의 핵심 동작으로 Old Generation을 정리할 때 전체 Old Generation을 대상으로 하지 않고 특정 Region 대상으로 주로 죽은 객체가 많은 Region을 우선하여 선택적으로 회수한다. 한 번에 Old Generation의 Garbage 수집 비용이 크므로 나누어 여러 번 수행한다. 짧은 STW 시간으로 큰 성능 저하 없이 메모리를 정리할 수 있다.
:::

- G1 GC는 더 이상 Old Region을 효율적으로 줄이지 못한다 판단할 때 이 단계를 종료한다.

[장점]
- Young / Old Generation 통째로 Compaction할 필요없이 Generation의 일부 Region에 대해서만 Compaction 하면 된다. → 부분적, 선택적인 GC 할 수 있어 대용량 Heap에서 좋은 성능을 보인다.
- CMS GC에 비해 개선된 방식으로 처리 속도가 더 빠르다.

[단점]
- 알고리즘이 복잡하기 때문에 프로세서 사용량이 증가할 수 있다.
- Mixed GC로 더 이상 충분한 메모리 정리가 불가한 경우, Full GC 발생하여 긴 STW로 성능 저하를 초래할 수 있다.

::: warning Full GC
Heap 전체(Young / Old / Humongous Generation 모두 포함)를 대상으로 수행하는 가장 비용이 큰 GC 방식이다. 힙에 있는 모든 객체를 대상으로 하므로 G1 GC에서 가장 긴 STW 시간이 발생한다.
:::


## References
- Java Performance Fundamentals / 김한도 저
- https://d2.naver.com/helloworld/1329
- https://d2.naver.com/helloworld/37111
- https://docs.oracle.com/en/java/javase/17/gctuning/garbage-first-g1-garbage-collector1.html
- https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html
- https://steady-coding.tistory.com/590
- https://velog.io/@ddangle/Java-G1-GC-%EC%97%90-%EB%8C%80%ED%95%B4
- gpt4o