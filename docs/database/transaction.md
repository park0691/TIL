# Transaction
데이터베이스에서 한 번에 수행되어야 하는 작업의 논리적인 단위

## 특징
### Atomicity, 원자성
- 트랜잭션이 모두 반영되거나 아예 반영이 되지 않아야 한다.
- 트랜잭션 수행 도중 어떤 일부 작업이 실패하면 다른 작업도 모두 롤백되어야 한다. `All-or-nothing`

### Consistency, 일관성
- 트랜잭션의 수행 후에도 DB의 상태는 일관성을 유지해야 한다.
- 트랜잭션 전과 후의 DB 상태는 정의된 규칙, 제약 조건을 위반하지 않아야 한다.
> '모든 학생은 학번이 존재해야 한다.' 학사 DB의 제약 조건이 있다고 가정하자.
> 하지만 입학 예정 신입생은 등록 전이라 학번이 없기 때문에 신입생에게 임시 학번을 부여하는 경우가 많다. 일관성을 유지하기 위함이다.
> 

### Isolation, 격리성
- 여러 트랜잭션이 동시에 수행될 때 각 트랜잭션은 다른 트랜잭션의 간섭 없이 독립적으로 수행되도록 격리되어야 한다.

### Durability, 지속성
- 완료된 트랜잭션의 수행 결과는 영구적으로 반영되어야 한다.
- 시스템 오류나 장애가 발생하더라도 데이터의 변경 사항은 유지되어야 한다.

## 연산
### COMMIT
- 트랜잭션이 성공적으로 끝났을 때 수행
- 트랜잭션이 행한 갱신 연산이 완료된 것을 트랜잭션 관리자에게 알려준다.

### ROLLBACK
- 트랜잭션 처리가 비정상적으로 종료되었을 때 수행
- 트랜잭션의 원자성을 구현하기 위해 트랜잭션이 행한 모든 연산을 취소한다.

## 상태
### Active
- 트랜잭션이 연산을 실행 중인 상태

### Failed
- 트랜잭션 실행에 오류가 발생해 중단된 상태

### Partially Committed
- 트랜잭션이 마지막 연산까지 수행되고 COMMIT 연산이 실행되기 직전의 상태

### Committed
- 트랜잭션이 성공적으로 종료되어 COMMIT 연산을 실행한 후의 상태

### Aborted
- 트랜잭션이 비정상 종료되어 ROLLBACK 연산을 수행한 상태


## 병행 처리시 발생하는 문제 현상
### 갱신 손실, Lost Update
- 한 트랜잭션이 수행한 데이터 변경된 결과를 다른 트랜잭션이 덮어써서 하나의 변경이 누락되는 현상

### 모순성, Inconsistency
![모순성](/images/db/20240905-db-transaction-1.png)
- 한 트랜잭션이 갱신 작업을 하고 있는데 다른 트랜잭션이 같은 영역에서 갱신 작업하여 데이터베이스의 일관성이 깨지는 현상


### 연쇄 복귀, Cascading Rollback
![연쇄 복귀](/images/db/20240905-db-transaction-2.png)
- 트랜잭션이 완료되기 전 ROLLBACK 수행하면, ROLLBACK 전 트랜잭션이 변경한 데이터를 가져가서 변경한 다른 트랜잭션에도 연쇄적으로 ROLLBACK이 수행된다.


## 격리 수준
특정 트랜잭션에서 다른 트랜잭션이 변경한 데이터를 볼 수 있는 기준을 결정한다.

### READ UNCOMMITTED (Level 0)
- COMMIT 되지 않은 다른 트랜잭션의 데이터를 읽는 것을 허용한다.
- 가장 낮은 격리 수준. 동시성이 가장 높다.
- 데이터의 일관성 유지 불가
- `DIRTY READ` 문제 (Level 0 격리 수준에서 발생)
	- 트랜잭션이 완료되지 않았는데 다른 트랜잭션에서 데이터를 읽는 현상 (COMMIT 안 된 데이터를 읽어)
	- 데이터가 나타났다 사라졌다, 변경되지 않은 데이터가 보이기도 하는 등 데이터의 정합성에 심각한 문제

### READ COMMITTED (Level 1)
![READ COMMITTED](/images/db/20240905-db-transaction-3.png)
- (READ 시간 기준으로 그 전에) COMMIT 된 데이터만 읽을 수 있다. DIRTY READ 방지
- 대부분의 RDBMS에서 기본 설정으로 사용
- `NON-REPEATABLE READ` 문제 (Level 0, 1 격리 수준에서 발생)
	- 한 트랜잭션 내에서 SELECT 쿼리를 여러 번 수행했을 때 다른 데이터를 가져오는 현상
	- REPEATABLE READ 정합성에 어긋난다.

### REPEATABLE READ (Level 2)
![REPEATABLE READ](/images/db/20240905-db-transaction-4.png)
- TX 시작 시간 기준으로 그 전에 COMMIT 된 데이터를 읽는다.
- 트랜잭션 내에서 같은 데이터를 여러 번 읽어도 항상 동일한 결과를 반환한다.
- `PHANTOM READ` 문제 (Level 0, 1, 2 격리 수준에서 발생)
	- 한 트랜잭션 내에서 없던 데이터가 생기는 현상
	- 처음 SELECT 수행 시 존재하지 않았던 데이터가 두 번째 SELECT 수행 시 나타난다.
	- 새로운 레코드의 삽입을 허용하기 때문에 발생한다.
- `MVCC`를 이용해 한 트랜잭션이 시작한 시점의 버전 데이터를 보여준다.
	- 모든 트랜잭션은 고유한 TXID를 가지고 있으며 UNDO 영역에 백업된 레코드에 변경을 발생시킨 TXID를 포함한다.
	- UNDO 영역에서 자신보다 낮은 TXID가 변경한 데이터만 확인할 수 있다.
	- MVCC를 보장하기 위해 실행 중인 트랜잭션 가운데 가장 오래된 트랜잭션 번호보다 앞선 트랜잭션 번호를 가진 UNDO 영역의 데이터를 삭제할 수 없다.

### SERIALIZABLE (Level 3)
- 가장 높은 격리 수준. 모든 트랜잭션을 순차적으로 실행시킨다.
- 여러 트랜잭션이 동일한 레코드에 동시 접근할 수 없어서 데이터의 부정합 문제 발생하지 않는다.
- 성능 저하가 크고, 동시성 제어가 제한적이며 교착 상태 발생할 가능성이 높다.


## References
- https://dheldh77.tistory.com/entry/%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98Transaction
- https://engineerinsight.tistory.com/182
- https://le2ksy.tistory.com/13
- 한빛 아카데미
- https://youtu.be/bLLarZTrebU?si=JB6U9hffdGm-MMXT