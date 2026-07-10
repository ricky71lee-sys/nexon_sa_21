(function () {
  const { createApp, reactive, computed, onMounted } = Vue;

  const DATA_BASE = "./assets/data";
  const DAY_REWARDS = [
    "위장 닉네임 3일",
    "플러스 콤보팩 EX 3일",
    "수박 무기 멀티카운트",
    "도안_특수밀봉",
    "고수 컬러 닉네임 3일",
    "3만 경험치",
    "패스티켓 5개",
    "대박 포인트 상자",
    "아트탄-영혼 탈출 3일",
    "5만 경험치",
    "제작 재료 3,000개",
    "리센느 멀티카운트",
    "분해용 부속",
    "두꺼운 컬러 닉네임 3일",
    "유니크 카운트",
    "퍼니 캐릭터 상자",
    "저격 기간연장 영구제",
    "영구제 밀봉",
    "컬러 닉네임 3일",
    "경험치 부스터 2.0 3일",
    "5만 경험치",
  ];
  const DOW = "일월화수목금토";

  async function fetchApi(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("NETWORK");
    const data = await res.json();
    if (data.rtnCode !== "0000") {
      await Utils.alert(data.message || "오류가 발생했습니다.");
      throw new Error(data.message);
    }
    return data.result;
  }

  createApp({
    setup() {
      /* [상태] */
      const user = reactive({
        login: true,
        character: true,
        penalty: false,
      });

      const medal = reactive({
        issued: false,
        code: "",
        side: null,
        phase: 1,
        quota: 5,
        sentTo: null,
        received: [],
        sortMode: "new",
        matched: null,
        claimed: false,
        find: {
          input: "",
          preview: null,
          alert: null,
        },
      });

      const attend = reactive({
        state: Array(21).fill(0),
        todayIdx: 0,
        makeup: 0,
        streak: 0,
        hasDuo: false,
        claimed: [],
        msClaimed: [],
        duoMsClaimed: [],
        streakDays: [],
        refreshAt: 0,
      });

      const vault = reactive({
        open: false,
        rewards: [],
      });

      const ui = reactive({
        notice: null,
      });

      /* [정적 데이터] */
      const steps = [
        { id: "step-01", n: 1, title: "메달 발급", sub: "반쪽 메달·코드" },
        { id: "step-02", n: 2, title: "반쪽 찾기", sub: "코드 공유·신청" },
        { id: "step-03", n: 3, title: "메달 합체", sub: "신청 수락" },
        { id: "step-04", n: 4, title: "메달 완성", sub: "보상 수령" },
      ];

      const rewardItems = [
        { id: "rw-medal", label: "완성 메달", value: "21주년 한정 메달", tone: "info" },
        {
          id: "rw-base",
          label: "기본 보상 (확정)",
          value: "10만 경험치 · 리센느 멀티카운트 · 돌격 기간연장 영구제",
          tone: "accent",
        },
        { id: "rw-lottery", label: "추첨 보상 (종료 후)", value: "MD · 넥슨캐시 추첨", tone: "info" },
      ];

      const rewardGuide = [
        {
          id: "guide-fixed",
          title: "확정 보상",
          desc: "메달 합체(매칭) 완료 시 양쪽 서든러 모두 기본 보상 지급",
          detail: "10만 경험치 · 리센느 멀티카운트 · 돌격 기간연장 영구제",
        },
        {
          id: "guide-lottery",
          title: "추첨 보상 (이벤트 종료 후)",
          desc: "매칭 완료 유저 대상 추첨 — 21주년 MD 100명 · 1만 넥슨캐시 2,100명",
        },
      ];

      const milestoneDefs = [
        { d: 7, g: "10만 경험치" },
        { d: 14, g: "보조 기간연장 영구제" },
        { d: 21, g: "1,000 SP" },
      ];

      const duoMilestoneDefs = [
        { d: 7, g: "특수 무기 멀티카운트" },
        { d: 14, g: "5만 경험치" },
        { d: 21, g: "21주년 한정 칭호" },
      ];

      const notices = {
        e1: [
          "참여 제한: 본 이벤트는 계정당 1회만 참여 가능하며, 1:1 매칭으로만 진행됩니다.",
          "신청 제한: 메달 합체 신청은 1일 최대 5회까지만 가능하며, 매일 오전 8시에 초기화됩니다.",
          "신청 취소: 상대방에게 보낸 메달 합체 신청은 상대가 수락하기 전까지 언제든지 취소할 수 있습니다.",
          "듀오 결성 후 변경 불가: 듀오가 결성된 이후에는 어떠한 경우에도 듀오 변경·취소가 불가능합니다.",
          "보상 지급: '보상 받기' 클릭 시 보상 아이템이 인게임 선물함으로 즉시 지급됩니다.",
          "수령 기간: 보상은 9월 3일(목) 정기점검 전까지만 수령 가능합니다.",
        ],
        e2: [
          "출석 인정 기준: 이벤트 기간 동안 게임에 1회 이상 접속하면 당일 출석으로 인정됩니다.",
          "출석 현황 갱신: '출석 갱신하기'는 3분 간격으로만 가능합니다.",
          "듀오 동반 출석 보상: 듀오 결성 후 같은 날 함께 출석하면 보충 출석권 1장 지급 (최대 5장).",
          "연속 출석 보상: 3일 연속 접속할 때마다 보충 출석권 1장 지급 (최대 5장).",
          "보충 출석권 사용: 보충으로 메운 날은 연속·동반 출석 조건에 반영되지 않습니다.",
          "보상 수령 기간: 보상은 9월 3일(목) 정기점검 전까지만 수령 가능합니다.",
        ],
        e3: [
          "쇼케이스 일정·출연진·경품은 사전 고지 없이 변경될 수 있습니다.",
          "시청 이벤트 참여 방법 및 당첨자 발표 일정은 각 이벤트 안내를 따릅니다.",
          "승부 예측·퀴즈 등 참여형 이벤트는 SOOP·YouTube 채널 공지를 확인해 주세요.",
        ],
      };

      const showcase = {
        timetable: [
          {
            part: "1부 · 오프닝 & 1라운드",
            rows: [
              ["18:00", "오프닝 · 21주년 하이라이트"],
              ["18:20", "최강 듀오 선발전 1R — 팀 A vs 팀 B"],
              ["19:00", "시청자 퀴즈 이벤트"],
            ],
          },
          {
            part: "2부 · 결승 & 시상",
            rows: [
              ["19:30", "최강 듀오 선발전 결승"],
              ["20:10", "21주년 신규 콘텐츠 공개"],
              ["20:40", "시청 이벤트 추첨 · 클로징"],
            ],
          },
        ],
        teams: [
          {
            key: "t1",
            name: "TEAM PHOENIX",
            pro: { aff: "프로", name: "선수A", pos: "Rifle" },
            ama: { aff: "아마", name: "선수B", pos: "Sniper" },
          },
          {
            key: "t2",
            name: "TEAM STORM",
            pro: { aff: "프로", name: "선수C", pos: "Rifle" },
            ama: { aff: "아마", name: "선수D", pos: "Support" },
          },
          {
            key: "t3",
            name: "TEAM BLAZE",
            pro: { aff: "프로", name: "선수E", pos: "Rifle" },
            ama: { aff: "아마", name: "선수F", pos: "Rifle" },
          },
          {
            key: "t4",
            name: "TEAM NOVA",
            pro: { aff: "프로", name: "선수G", pos: "Sniper" },
            ama: { aff: "아마", name: "선수H", pos: "Rifle" },
          },
        ],
        casters: [
          { key: "c1", name: "캐스터1", role: "해설 · 분석" },
          { key: "c2", name: "캐스터2", role: "진행 · 인터뷰" },
          { key: "c3", name: "캐스터3", role: "현장 · 코너 MC" },
        ],
        events: [
          {
            no: 1,
            title: "라이브 시청 인증",
            desc: "SOOP·YouTube 라이브 시청 후 인증하면 추첨 응모",
            reward: "넥슨캐시 1,000원 (500명)",
            cta: "",
          },
          {
            no: 2,
            title: "승부 예측",
            desc: "결승전 승리 팀을 맞히면 추가 보상 응모",
            reward: "21주년 MD (50명)",
            cta: "승부 예측 참여",
          },
          {
            no: 3,
            title: "실시간 퀴즈",
            desc: "방송 중 공개되는 퀴즈 정답 제출",
            reward: "경험치 부스터 (1,000명)",
            cta: "",
          },
          {
            no: 4,
            title: "채팅 이벤트",
            desc: "지정 키워드 채팅 참여",
            reward: "패스티켓 10개 (300명)",
            cta: "",
          },
          {
            no: 5,
            title: "하이라이트 공유",
            desc: "쇼케이스 하이라이트 SNS 공유 인증",
            reward: "컬러 닉네임 7일 (200명)",
            cta: "공유 인증하기",
          },
        ],
      };

      /* [계산값] */
      const isUserValid = computed(
        () => user.login && user.character && !user.penalty
      );

      const sortedReceived = computed(() => {
        const list = [...medal.received];
        list.sort((a, b) =>
          medal.sortMode === "new" ? (b.t || 0) - (a.t || 0) : (a.t || 0) - (b.t || 0)
        );
        return list.slice(0, 10);
      });

      const totalDays = computed(
        () => attend.state.filter((s) => s > 0).length
      );

      const duoDays = computed(
        () => attend.state.filter((s) => s === 2).length
      );

      const days = computed(() => {
        return DAY_REWARDS.map((reward, i) => {
          const d = new Date(2026, 7, 6 + i);
          const s = attend.state[i];
          const makeable = s === 0 && i < attend.todayIdx;
          const claimed = attend.claimed.includes(i);
          return {
            i,
            id: "day-" + String(i + 1).padStart(2, "0"),
            label: `${d.getMonth() + 1}월 ${d.getDate()}일`,
            dow: `(${DOW[d.getDay()]})`,
            weekend: d.getDay() === 0 || d.getDay() === 6,
            s,
            reward,
            makeable,
            claimed,
            streak: attend.streakDays.includes(i),
          };
        });
      });

      const progress = computed(() =>
        Math.round((totalDays.value / 21) * 100)
      );

      const noticeTitle = computed(() => {
        if (ui.notice === "e1") return "· 메달 합체";
        if (ui.notice === "e2") return "· 21일 출석";
        if (ui.notice === "e3") return "· 쇼케이스";
        return "";
      });

      const duoLabel = computed(() =>
        attend.hasDuo && medal.matched
          ? "듀오와 함께 출석 중 · " + medal.matched.nick
          : attend.hasDuo
            ? "듀오와 함께 출석 중"
            : "나 혼자 출석 중 (이벤트1 미참여)"
      );

      /* [API 연동 지점] */
      function applyMedalState(result) {
        medal.issued = !!result.issued;
        medal.code = result.code || "";
        medal.side = result.side || null;
        medal.quota = result.quota ?? 5;
        medal.phase = result.phase || (medal.issued ? 2 : 1);
        medal.sentTo = result.sentTo || null;
        medal.matched = result.matched || null;
        medal.claimed = !!result.claimed;
        medal.received = (result.received || []).map((r, idx) => ({
          ...r,
          t: r.t ?? 1000 - idx,
        }));
        if (medal.matched) {
          attend.hasDuo = true;
        }
      }

      function applyAttendanceState(result) {
        attend.state = [...(result.state || Array(21).fill(0))];
        attend.todayIdx = result.todayIdx ?? 0;
        attend.makeup = result.makeup ?? 0;
        attend.streak = result.streak ?? 0;
        attend.hasDuo = result.hasDuo ?? attend.hasDuo;
        attend.claimed = [...(result.claimed || [])];
        attend.msClaimed = [...(result.msClaimed || [])];
        attend.duoMsClaimed = [...(result.duoMsClaimed || [])];
        attend.streakDays = [...(result.streakDays || [])];
      }

      async function getMedalState() {
        // TODO: API — GET 내 메달 초기상태
        const result = await fetchApi(DATA_BASE + "/medal.json");
        applyMedalState(result);
      }

      async function postIssueMedal() {
        // TODO: API — POST 메달 발급
        const result = await fetchApi(DATA_BASE + "/medal_issued.json");
        medal.issued = true;
        medal.code = result.code;
        medal.side = result.side;
        medal.received = (result.received || []).map((r, idx) => ({
          ...r,
          t: r.t ?? 1000 - idx,
        }));
        medal.phase = 2;
        return result;
      }

      async function getPartner(code) {
        // TODO: API — GET 코드 조회
        const table = await fetchApi(DATA_BASE + "/partner.json");
        const key = code.toUpperCase();
        const hit = table.lookup[key];
        if (hit) return { ...hit };
        return {
          ...table.default,
          nick: table.default.nick + "_" + code.slice(-2),
        };
      }

      async function postSendRequest(payload) {
        // TODO: API — POST 합체 신청
        void payload;
        return { ok: true };
      }

      async function postAcceptMerge(payload) {
        // TODO: API — POST 신청 수락/완성
        void payload;
        return {
          matched: payload,
          reward: { basic: ["10만 경험치", "리센느 멀티카운트"] },
        };
      }

      async function postClaimReward() {
        // TODO: API — POST 기본 보상 수령
        return { ok: true };
      }

      async function getAttendance() {
        // TODO: API — GET 출석 현황
        const result = await fetchApi(DATA_BASE + "/attendance.json");
        applyAttendanceState(result);
      }

      async function getVaultRewards() {
        // TODO: API — GET 보상함
        const result = await fetchApi(DATA_BASE + "/vault.json");
        vault.rewards = result.rewards || [];
        return result;
      }

      /* [동작 함수] */
      function moveTo(target) {
        if (window.bodyScroll) bodyScroll.move(target);
      }

      function setSort(mode) {
        medal.sortMode = mode;
      }

      async function clickIssueMedal() {
        if (!user.login) return Utils.alert("로그인이 필요합니다.");
        if (!user.character)
          return Utils.alert("서든어택 계정(캐릭터)이 필요합니다.");
        if (user.penalty)
          return Utils.alert("이벤트 참여가 제한된 계정입니다.");
        if (medal.issued) return;
        await postIssueMedal();
      }

      function copyCode() {
        if (!medal.code) return;
        navigator.clipboard?.writeText(medal.code);
        Utils.alert("코드가 복사되었습니다.<br><b>" + medal.code + "</b>");
      }

      function clickShare() {
        Utils.alert("SNS 공유 기능은 API 연동 후 제공됩니다.");
      }

      async function lookupLive() {
        const code = medal.find.input.trim().toUpperCase();
        medal.find.preview = null;
        medal.find.alert = null;
        if (code.length < 4) return;
        if (code === medal.code) {
          medal.find.alert = {
            type: "warn",
            text: "본인 코드는 신청할 수 없습니다.",
            ok: false,
          };
          return;
        }
        const res = await getPartner(code);
        if (!res.found) {
          medal.find.alert = {
            type: "warn",
            text: res.reason || "존재하지 않는 코드입니다.",
            ok: false,
          };
          return;
        }
        if (!res.matchable) {
          medal.find.alert = {
            type: "warn",
            text: res.reason || "합체 신청할 수 없는 유저입니다.",
            ok: false,
          };
          return;
        }
        medal.find.preview = { nick: res.nick, side: res.side };
        medal.find.alert = {
          type: "ok",
          text: res.nick + " 님에게 합체 신청을 보낼 수 있습니다.",
          ok: medal.quota > 0 && !medal.sentTo,
        };
      }

      function fillHint(code) {
        medal.find.input = code;
        lookupLive();
      }

      async function clickSendRequest() {
        if (!medal.find.alert?.ok || medal.quota <= 0 || medal.sentTo) return;
        const nick = medal.find.preview?.nick || "상대";
        const ok = await Utils.confirm(
          "<b>" + nick + "</b> 님에게 메달 합체 신청을 보낼까요?"
        );
        if (!ok) return;
        await postSendRequest({
          code: medal.find.input,
          nick,
        });
        medal.quota--;
        medal.sentTo = { nick, code: medal.find.input.toUpperCase() };
        medal.phase = 3;
        medal.find.alert = null;
      }

      async function cancelRequest() {
        if (!medal.sentTo) return;
        const ok = await Utils.confirm("보낸 합체 신청을 취소할까요?");
        if (!ok) return;
        medal.sentTo = null;
        medal.phase = 2;
        medal.quota = Math.min(5, medal.quota + 1);
      }

      async function partnerAccepts() {
        if (!medal.sentTo) return;
        await completeMatch({
          nick: medal.sentTo.nick,
          code: medal.sentTo.code,
        });
      }

      async function completeMatch(partner) {
        await postAcceptMerge(partner);
        medal.matched = { nick: partner.nick, code: partner.code };
        medal.sentTo = null;
        medal.phase = 4;
        attend.hasDuo = true;
      }

      async function clickAcceptReceived(code) {
        if (medal.claimed || medal.phase === 4) return;
        const item = medal.received.find((r) => r.code === code);
        if (!item) return;
        const ok = await Utils.confirm(
          "<b>" + item.nick + "</b> 님과 메달을 합칠까요?"
        );
        if (!ok) return;
        await completeMatch({ nick: item.nick, code: item.code });
        medal.received = medal.received.filter((r) => r.code !== code);
      }

      function rejectReceived(code) {
        medal.received = medal.received.filter((r) => r.code !== code);
      }

      async function clickClaimReward() {
        if (medal.claimed || medal.phase !== 4) return;
        await postClaimReward();
        medal.claimed = true;
        attend.hasDuo = true;
        await Utils.alert("기본 보상이 지급되었습니다.");
      }

      async function checkIn(type) {
        if (!isUserValid.value) return Utils.alert("참여 자격을 확인해 주세요.");
        if (attend.todayIdx >= 21) return;
        if (type === "duo" && !attend.hasDuo)
          return Utils.alert("먼저 이벤트1에서 듀오를 맺어주세요.");
        attend.state[attend.todayIdx] = type === "duo" ? 2 : 1;
        attend.todayIdx++;
        // TODO: API — POST 출석 처리
      }

      async function clickDay(i) {
        const day = days.value.find((d) => d.i === i);
        if (!day) return;
        if (day.s > 0 && !day.claimed) {
          attend.claimed.push(i);
          // TODO: API — POST 일별 보상 수령
          return;
        }
        if (day.makeable && attend.makeup > 0) {
          const ok = await Utils.confirm(
            day.label + " 보충 출석권으로 출석 처리할까요?"
          );
          if (!ok) return;
          attend.makeup--;
          attend.state[i] = 4;
          // TODO: API — POST 보충 출석
        }
      }

      async function clickClaimMilestone(d) {
        if (totalDays.value < d || attend.msClaimed.includes(d)) return;
        attend.msClaimed.push(d);
        // TODO: API — POST 개인 마일스톤 수령
      }

      async function clickClaimDuoMilestone(d) {
        if (duoDays.value < d || attend.duoMsClaimed.includes(d)) return;
        attend.duoMsClaimed.push(d);
        // TODO: API — POST 동반 마일스톤 수령
      }

      async function claimAllDaily() {
        // TODO: API — POST 일괄 수령
        days.value.forEach((d) => {
          if (d.s > 0 && !d.claimed) attend.claimed.push(d.i);
        });
        await Utils.alert("수령 가능한 일별 보상을 모두 받았습니다.");
      }

      async function clickRefreshAttendance() {
        const now = Date.now();
        if (now - attend.refreshAt < 180000) {
          const sec = Math.ceil((180000 - (now - attend.refreshAt)) / 1000);
          return Utils.alert(
            "출석 갱신은 3분 간격입니다.<br>(약 " + sec + "초 후 가능)"
          );
        }
        attend.refreshAt = now;
        await getAttendance();
        await Utils.alert("출석 현황이 갱신되었습니다.");
      }

      async function openVault() {
        await getVaultRewards();
        vault.open = true;
        Utils.bodyScroll.hide();
      }

      function closeVault() {
        vault.open = false;
        Utils.bodyScroll.show();
      }

      function openNotice(key) {
        ui.notice = key;
        Utils.bodyScroll.hide();
      }

      function closeNotice() {
        ui.notice = null;
        Utils.bodyScroll.show();
      }

      /* [초기화] */
      onMounted(async () => {
        await getMedalState();
        await getAttendance();
        setTimeout(function () {
          if (location.hash && window.bodyScroll) {
            bodyScroll.move(location.hash, 0);
          } else if (window.pageScroll) {
            pageScroll.initHash();
          }
        }, 300);
      });

      return {
        user,
        medal,
        attend,
        vault,
        ui,
        steps,
        rewardItems,
        rewardGuide,
        milestoneDefs,
        duoMilestoneDefs,
        notices,
        showcase,
        isUserValid,
        sortedReceived,
        totalDays,
        duoDays,
        days,
        progress,
        noticeTitle,
        duoLabel,
        moveTo,
        setSort,
        clickIssueMedal,
        copyCode,
        clickShare,
        lookupLive,
        fillHint,
        clickSendRequest,
        cancelRequest,
        partnerAccepts,
        clickAcceptReceived,
        rejectReceived,
        clickClaimReward,
        checkIn,
        clickDay,
        clickClaimMilestone,
        clickClaimDuoMilestone,
        claimAllDaily,
        clickRefreshAttendance,
        openVault,
        closeVault,
        openNotice,
        closeNotice,
      };
    },
  }).mount(".wrap");
})();
