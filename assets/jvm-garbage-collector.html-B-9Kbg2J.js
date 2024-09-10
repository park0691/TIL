import{_ as e,c as l,o as a,b as r}from"./app-BB5urgAm.js";const o="/TIL/images/java/20240910-garbage-collector-1.png",c="/TIL/images/java/20240910-garbage-collector-2.png",n="/TIL/images/java/20240910-garbage-collector-3.png",t={},i=r('<h1 id="garbage-collector" tabindex="-1"><a class="header-anchor" href="#garbage-collector"><span>Garbage Collector</span></a></h1><h2 id="serial-gc" tabindex="-1"><a class="header-anchor" href="#serial-gc"><span>Serial GC</span></a></h2><ul><li>Young Gen에서 Generational Algorithm, Old Gen에서 Mark and Compaction Algorithm을 사용한다.</li><li>서버의 CPU 코어 하나를 사용하여 처리하는 방식으로 1개 스레드만 이용하여 GC 처리한다.</li></ul><p>IT 환경이 급변하며 Heap 사이즈가 커짐에 따라 Suspend 문제는 더 두드러지게 되었다.</p><h2 id="parallel-gc" tabindex="-1"><a class="header-anchor" href="#parallel-gc"><span>Parallel GC</span></a></h2><p>이 문제를 해결하기 위해 모든 리소스를 투입하여 GC를 빨리 끝내자는 전략이 나왔다. 대용량 Heap에 적합한 전략으로 Garbage Collector는 병렬 처리를 수행하는 방법을 채택한 Parallel GC가 나왔다. 이러한 컬렉터를 Throughput Collector라고 부른다.</p><p><img src="'+o+'" alt="parallel-gc"><em>출처 : Java Performance Fundamentals / 김한도 저</em></p><ul><li>Java 8의 default GC</li><li>Serial GC와 기본적인 알고리즘은 같지만 Young Gen의 GC를 멀티 스레드로 수행한다.</li><li>많은 리소스를 투입하여 동시에 수행하므로 Suspend 시간이 단축된다.</li></ul><h2 id="parallel-old-gc-parallel-compacting-collector" tabindex="-1"><a class="header-anchor" href="#parallel-old-gc-parallel-compacting-collector"><span>Parallel Old GC, Parallel Compacting Collector</span></a></h2><p>Young Gen의 Suspend 시간 단축 효과를 본 Parallel Algorithm을 Old Gen에도 적용한다.</p><ul><li>Parallel GC 개선</li><li>Young Gen 뿐만 아니라 Old Gen의 GC도 멀티 스레드로 수행한다.</li></ul><h2 id="cms-gc-concurrent-mark-sweep-collector" tabindex="-1"><a class="header-anchor" href="#cms-gc-concurrent-mark-sweep-collector"><span>CMS GC, Concurrent Mark-Sweep Collector</span></a></h2><p>Young Gen은 Parallel Copy Algorithm을 사용하고, Old Gen은 Concurrent Mark-and-Sweep Algorithm을 사용한다. 애플리케이션 스레드와 GC 스레드가 동시 실행되어 Suspend 시간을 최대한 줄이기 위해 고안되었다.</p><p><img src="'+c+'" alt="cms-gc"><em>출처 : https://d2.naver.com/helloworld/1329</em></p><p>[장점]</p><ul><li>애플리케이션의 Suspend 시간이 짧으며 Compaction을 수행하지 않아 GC 중에도 최대한 애플리케이션의 수행을 보장한다.</li></ul><p>[단점]</p><ul><li>다른 GC 방식보다 메모리와 CPU를 더 많이 사용한다. <ul><li>GC 대상의 식별 작업이 복잡한 여러 단계로 수행, Concurrent 작업 수행되어 다른 GC 대비 오버헤드가 크다.</li></ul></li><li>반복된 Sweep으로 Heap의 단편화가 발생할 수 있다.</li></ul><h3 id="동작-과정-concurrent-mark-sweep-algorithm" tabindex="-1"><a class="header-anchor" href="#동작-과정-concurrent-mark-sweep-algorithm"><span>동작 과정, Concurrent Mark-Sweep Algorithm</span></a></h3><ol><li><p>Initial Mark<br> Root Set에서 직접 레퍼런스 되는 (가장 가까운) 객체만 찾아낸다.<br> 싱글 스레드만 사용되는 Serial Phase이며, Heap은 Suspend 상태가 된다. 그러나 Root Set에서 직접 레퍼런스되는 객체만 찾아내기 때문에 Suspend 시간은 매우 짧다.</p></li><li><p>Concurrent Mark<br> 앞 단계에서 직접 레퍼런스된 객체들을 따라가며 추적하여 레퍼런스되는 객체들을 찾아낸다.<br> 싱글 스레드만 사용되는 Serial Phase이지만 다른 스레드들과 동시에 수행된다.</p></li><li><p>Remark<br> 유일한 Parallel Phase로 모든 스레드가 GC에 동원되기 때문에 애플리케이션은 잠시 중단된다. Concurrent Mark 단계에서 새로 추가되거나 참조가 끊긴 객체를 다시 확인한다. 이미 마킹된 Object를 다시 추적하여 Live 여부를 확정한다.</p></li><li><p>Concurrent Sweep<br> Serial Phase로 다른 스레드들이 실행되고 있는 상태에서 참조가 끊긴 객체의 할당을 해제한다. Sweep 작업만 수행할 뿐 Compaction 작업은 수행하지 않는다.</p></li></ol><div class="custom-container tip"><p class="custom-container-title">CMS GC는 왜 Compaction 안 하나?</p><p>todo...</p></div><h2 id="g1-gc-garbage-first-collector" tabindex="-1"><a class="header-anchor" href="#g1-gc-garbage-first-collector"><span>G1 GC, Garbage First Collector</span></a></h2><p><img src="'+n+'" alt="g1-gc"></p><p>CMS GC를 개선하기 위해 도입되었다.<br> Garbage First라는 이름은 Garbage로만 꽉 차있는 Region부터 먼저 정리를 시작한다 해서 붙게 되었다. 이전 GC와는 달리 Heap 전체를 탐색하지 않고 Region 단위로 탐색하여 Garbage가 많은 영역이 GC 대상이 된다.</p><ul><li>Java 9의 default GC</li><li>물리적인 Young / Old Generation 구분을 없애고 Heap을 균등한 Region으로 분할하고 각 Region에 동적으로 Eden, Survivor, Old 역할을 동적으로 부여한다. <ul><li>Region은 Allocation, Promotion 기능을 가진 메모리 공간으로써 상당히 개념적이다. Region에 새로 할당되면 Young Generation, Promotion 되면 그 Region을 Old Generation이라 한다.</li></ul></li></ul><h3 id="동작-과정" tabindex="-1"><a class="header-anchor" href="#동작-과정"><span>동작 과정</span></a></h3><p>todo...</p><h2 id="references" tabindex="-1"><a class="header-anchor" href="#references"><span>References</span></a></h2><ul><li>Java Performance Fundamentals / 김한도 저</li><li>https://d2.naver.com/helloworld/1329</li></ul>',29),s=[i];function p(g,h){return a(),l("div",null,s)}const m=e(t,[["render",p],["__file","jvm-garbage-collector.html.vue"]]),u=JSON.parse('{"path":"/java/jvm-garbage-collector.html","title":"Garbage Collector","lang":"en-US","frontmatter":{},"headers":[{"level":2,"title":"Serial GC","slug":"serial-gc","link":"#serial-gc","children":[]},{"level":2,"title":"Parallel GC","slug":"parallel-gc","link":"#parallel-gc","children":[]},{"level":2,"title":"Parallel Old GC, Parallel Compacting Collector","slug":"parallel-old-gc-parallel-compacting-collector","link":"#parallel-old-gc-parallel-compacting-collector","children":[]},{"level":2,"title":"CMS GC, Concurrent Mark-Sweep Collector","slug":"cms-gc-concurrent-mark-sweep-collector","link":"#cms-gc-concurrent-mark-sweep-collector","children":[{"level":3,"title":"동작 과정, Concurrent Mark-Sweep Algorithm","slug":"동작-과정-concurrent-mark-sweep-algorithm","link":"#동작-과정-concurrent-mark-sweep-algorithm","children":[]}]},{"level":2,"title":"G1 GC, Garbage First Collector","slug":"g1-gc-garbage-first-collector","link":"#g1-gc-garbage-first-collector","children":[{"level":3,"title":"동작 과정","slug":"동작-과정","link":"#동작-과정","children":[]}]},{"level":2,"title":"References","slug":"references","link":"#references","children":[]}],"git":{"updatedTime":1725960746000,"contributors":[{"name":"depark","email":"mem29238@gmail.com","commits":1}]},"filePathRelative":"java/jvm-garbage-collector.md"}');export{m as comp,u as data};
