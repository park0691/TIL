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
Young Gen은 Parallel Copy Algorithm을 사용하고, Old Gen은 Concurrent Mark-and-Sweep Algorithm을 사용한다. 애플리케이션 스레드와 GC 스레드가 동시 실행되어 Suspend 시간을 최대한 줄이기 위해 고안되었다.

![cms-gc](/images/java/20240910-garbage-collector-2.png)
_출처 : https://d2.naver.com/helloworld/1329_

[장점]
- 애플리케이션의 Suspend 시간이 짧으며 Compaction을 수행하지 않아 GC 중에도 최대한 애플리케이션의 수행을 보장한다.

[단점]
- 다른 GC 방식보다 메모리와 CPU를 더 많이 사용한다.
	- GC 대상의 식별 작업이 복잡한 여러 단계로 수행, Concurrent 작업 수행되어 다른 GC 대비 오버헤드가 크다.
- 반복된 Sweep으로 Heap의 단편화가 발생할 수 있다.

### 동작 과정, Concurrent Mark-Sweep Algorithm
1. Initial Mark<br/>
	Root Set에서 직접 레퍼런스 되는 (가장 가까운) 객체만 찾아낸다.<br/>
	싱글 스레드만 사용되는 Serial Phase이며, Heap은 Suspend 상태가 된다. 그러나 Root Set에서 직접 레퍼런스되는 객체만 찾아내기 때문에 Suspend 시간은 매우 짧다.

2. Concurrent Mark<br/>
	앞 단계에서 직접 레퍼런스된 객체들을 따라가며 추적하여 레퍼런스되는 객체들을 찾아낸다.<br/>
	싱글 스레드만 사용되는 Serial Phase이지만 다른 스레드들과 동시에 수행된다.

3. Remark<br/>
	유일한 Parallel Phase로 모든 스레드가 GC에 동원되기 때문에 애플리케이션은 잠시 중단된다. Concurrent Mark 단계에서 새로 추가되거나 참조가 끊긴 객체를 다시 확인한다. 이미 마킹된 Object를 다시 추적하여 Live 여부를 확정한다.

4. Concurrent Sweep<br/>
	Serial Phase로 다른 스레드들이 실행되고 있는 상태에서 참조가 끊긴 객체의 할당을 해제한다. Sweep 작업만 수행할 뿐 Compaction 작업은 수행하지 않는다.

::: tip CMS GC는 왜 Compaction 안 하나?
todo...
:::

## G1 GC, Garbage First Collector
![g1-gc](/images/java/20240910-garbage-collector-3.png)

CMS GC를 개선하기 위해 도입되었다.<br/>
Garbage First라는 이름은 Garbage로만 꽉 차있는 Region부터 먼저 정리를 시작한다 해서 붙게 되었다. 이전 GC와는 달리 Heap 전체를 탐색하지 않고 Region 단위로 탐색하여 Garbage가 많은 영역이 GC 대상이 된다.

- Java 9의 default GC
- 물리적인 Young / Old Generation 구분을 없애고 Heap을 균등한 Region으로 분할하고 각 Region에 동적으로 Eden, Survivor, Old 역할을 동적으로 부여한다.
	- Region은 Allocation, Promotion 기능을 가진 메모리 공간으로써 상당히 개념적이다. Region에 새로 할당되면 Young Generation, Promotion 되면 그 Region을 Old Generation이라 한다.

### 동작 과정
todo...


## References
- Java Performance Fundamentals / 김한도 저
- https://d2.naver.com/helloworld/1329