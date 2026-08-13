"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, rupees } from "@/lib/api";
import type { Counterparty, Skill } from "@/lib/types";

const EXAMPLES = [
  "iPhone 15 128GB under 62k in Koramangala",
  "logo and brand kit under 8k, need it by Friday",
  "2BHK move from HSR to Whitefield on the 20th, under 15k",
];

type OutputResponse =
  | {
      type: "ask";
      data: {
        skill_id: string;
        options: { id: string; label: string; emoji: string }[];
        spec: Record<string, string | number>;
        phones: string[];
      };
    }
  | {
      type: "mission";
      data: {
        mission_id: string;
        skill?: { id: string; label: string; emoji: string };
        counterparties?: Counterparty[];
        spec?: Record<string, unknown>;
        test?: boolean;
      };
    };

export default function Home() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.stats>> | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [config, setConfig] = useState<{ test_number: string | null; twilio: boolean } | null>(null);
  const [pending, setPending] = useState<{
    skill_id: string;
    options: { id: string; label: string; emoji: string }[];
    spec: Record<string, string | number>;
    phones: string[];
  } | null>(null);

  // Video and response output state
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [pendingOutput, setPendingOutput] = useState<OutputResponse | null>(null);
  const [activeOutput, setActiveOutput] = useState<OutputResponse | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoEndedRef = useRef(false);
  const isPlayingVideoRef = useRef(false);
  const pendingOutputRef = useRef<OutputResponse | null>(null);
  const pendingErrorRef = useRef<string | null>(null);
  const slowMotionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.skills().then((r) => setSkills(r.skills)).catch((e) => setError(String(e.message)));
    api.health().then((h) => setConfig({ test_number: h.test_number, twilio: h.twilio })).catch(() => undefined);
    api.stats().then(setStats).catch(() => undefined);
  }, []);

  function clearSlowMotionTimer() {
    if (slowMotionTimerRef.current) {
      clearTimeout(slowMotionTimerRef.current);
      slowMotionTimerRef.current = null;
    }
  }

  function handleVideoPlaybackError() {
    clearSlowMotionTimer();
    isPlayingVideoRef.current = false;
    setIsPlayingVideo(false);
    if (pendingOutputRef.current) {
      setActiveOutput(pendingOutputRef.current);
      if (pendingOutputRef.current.type === "ask") {
        setPending({
          skill_id: "ask",
          options: pendingOutputRef.current.data.options,
          spec: pendingOutputRef.current.data.spec,
          phones: pendingOutputRef.current.data.phones,
        });
      }
      setBusy(false);
    } else if (pendingErrorRef.current) {
      setError(pendingErrorRef.current);
      setBusy(false);
    }
  }

  function startVideoPlayback() {
    clearSlowMotionTimer();
    videoEndedRef.current = false;
    pendingOutputRef.current = null;
    pendingErrorRef.current = null;
    isPlayingVideoRef.current = true;
    setVideoEnded(false);
    setPendingOutput(null);
    setActiveOutput(null);
    setIsPlayingVideo(true);

    if (videoRef.current) {
      const v = videoRef.current;
      v.currentTime = 0;
      v.playbackRate = 0.5; // Start in 0.5 slow motion
      v.muted = false;
      v.volume = 1.0;

      // If response takes longer than 2s, switch to high slow motion (0.3x)
      slowMotionTimerRef.current = setTimeout(() => {
        if (videoRef.current && isPlayingVideoRef.current && !pendingOutputRef.current && !pendingErrorRef.current) {
          videoRef.current.playbackRate = 0.3;
        }
      }, 2000);

      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn("Video playback error/policy:", e);
          v.muted = true;
          v.play().catch(() => {
            handleVideoPlaybackError();
          });
        });
      }
    }
  }

  function handleVideoEnded() {
    clearSlowMotionTimer();
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
    }

    if (pendingOutputRef.current) {
      videoEndedRef.current = true;
      isPlayingVideoRef.current = false;
      setVideoEnded(true);
      setIsPlayingVideo(false);
      setActiveOutput(pendingOutputRef.current);
      if (pendingOutputRef.current.type === "ask") {
        setPending({
          skill_id: "ask",
          options: pendingOutputRef.current.data.options,
          spec: pendingOutputRef.current.data.spec,
          phones: pendingOutputRef.current.data.phones,
        });
      }
      setBusy(false);
    } else if (pendingErrorRef.current) {
      videoEndedRef.current = true;
      isPlayingVideoRef.current = false;
      setVideoEnded(true);
      setIsPlayingVideo(false);
      setError(pendingErrorRef.current);
      setBusy(false);
    } else {
      if (videoRef.current && isPlayingVideoRef.current) {
        const v = videoRef.current;
        v.currentTime = 0;
        v.playbackRate = 0.3; // High slow motion while waiting for long result
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            handleVideoPlaybackError();
          });
        }
      } else {
        handleVideoPlaybackError();
      }
    }
  }

  function handleApiResponse(output: OutputResponse) {
    clearSlowMotionTimer();
    pendingOutputRef.current = output;
    setPendingOutput(output);

    if (videoRef.current && isPlayingVideoRef.current) {
      // Play at 0.5x slow motion when result occurs
      videoRef.current.playbackRate = 0.5;
    } else {
      setActiveOutput(output);
      if (output.type === "ask") {
        setPending({
          skill_id: "ask",
          options: output.data.options,
          spec: output.data.spec,
          phones: output.data.phones,
        });
      }
      setBusy(false);
    }
  }

  async function submit(overrideSkill?: string) {
    if (!text.trim() && !overrideSkill) return;
    setBusy(true);
    setError(null);
    startVideoPlayback();

    try {
      const parsed = pending ?? (await api.compose(text));
      const skillId = overrideSkill ?? parsed.skill_id;

      if (skillId === "ask") {
        const askData = {
          skill_id: "ask",
          options: parsed.options,
          spec: parsed.spec,
          phones: parsed.phones,
        };
        handleApiResponse({ type: "ask", data: askData });
        return;
      }

      const selectedSkill = skills.find((s) => s.id === skillId);
      const started = await api.startMission({
        skill_id: skillId,
        spec: fillDefaults(parsed.spec, selectedSkill),
        phones: parsed.phones,
        test: testMode,
      });

      handleApiResponse({
        type: "mission",
        data: {
          mission_id: started.mission_id,
          skill: started.skill ?? selectedSkill,
          counterparties: started.counterparties,
          spec: parsed.spec,
          test: started.test ?? testMode,
        },
      });
    } catch (e) {
      clearSlowMotionTimer();
      const errMsg = e instanceof Error ? e.message : String(e);
      pendingErrorRef.current = errMsg;
      if (videoRef.current && isPlayingVideoRef.current) {
        videoRef.current.playbackRate = 0.5;
      } else {
        setError(errMsg);
        setBusy(false);
      }
    }
  }

  async function runDemo(skillId: string) {
    setBusy(true);
    setError(null);
    startVideoPlayback();

    try {
      const r = await api.demo(skillId);
      const selectedSkill = skills.find((s) => s.id === skillId);
      handleApiResponse({
        type: "mission",
        data: {
          mission_id: r.mission_id,
          skill: selectedSkill,
          counterparties: r.counterparties,
          test: true,
        },
      });
    } catch (e) {
      clearSlowMotionTimer();
      const errMsg = e instanceof Error ? e.message : String(e);
      pendingErrorRef.current = errMsg;
      if (videoRef.current && isPlayingVideoRef.current) {
        videoRef.current.playbackRate = 0.5;
      } else {
        setError(errMsg);
        setBusy(false);
      }
    }
  }

  return (
    <main className="title-screen">
      <div className="scoreboard">
        <span className="px-plate">
          SAVED <b>{rupees(stats?.saved ?? 0)}</b>
        </span>
        <span className="px-plate">
          CALLS <b>{stats?.calls ?? 0}</b>
        </span>
        <span className="px-plate">
          MISSIONS <b>{stats?.missions ?? 0}</b>
        </span>
      </div>

      <h1 className="game-title">
        MOL<em>BHAV</em>
      </h1>
      <p className="game-sub">The bazaar negotiation game</p>

      <div className="px-panel hero-frame">
        <video
          ref={videoRef}
          src="/game/working_vioe.mp4"
          poster="/game/hero.png"
          playsInline
          preload="auto"
          controls={false}
          onEnded={handleVideoEnded}
          onError={handleVideoPlaybackError}
        />
      </div>

      <div className="composer">
        <div className="listener">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/game/manager.png" alt="" aria-hidden />
          <div className="cloud">
            <span className="who">Manager</span>
            {text.trim()
              ? `Got it: "${text.trim().slice(0, 60)}${text.trim().length > 60 ? "…" : ""}" - say the word and I'll brief the team.`
              : "Boss, what are we hunting today? Type it below - I'm listening."}
          </div>
        </div>

        <div className="px-panel chat-bar">
          <span aria-hidden>💬</span>
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPending(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="What do you need? e.g. iPhone 15 under 62k in Koramangala"
            aria-label="What do you need?"
            disabled={busy}
          />
          <button className="px-btn" onClick={() => submit()} disabled={busy}>
            {busy ? "Starting…" : "Start mission"}
          </button>
        </div>

        {pending ? (
          <>
            <span className="px-label">Which market is this?</span>
            <div className="quest-chips">
              {pending.options.map((o) => (
                <button key={o.id} className="px-chip" onClick={() => submit(o.id)}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="quest-chips">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="px-chip" onClick={() => setText(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}

        {config?.twilio ? (
          <div className="mode-row">
            <label className="toggle" data-on={testMode}>
              <input type="checkbox" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} />
              <span className="toggle-led" />
              Test mode
            </label>
            <span>
              {testMode ? (
                config.test_number ? (
                  <>
                    rings <b>{config.test_number}</b> instead of the shops, one call at a time
                  </>
                ) : (
                  <>no test number set - add TEST_CALL_REDIRECT to .env</>
                )
              ) : (
                <>calls real shops on the list</>
              )}
            </span>
          </div>
        ) : null}

        {error ? <div className="px-panel error-box">{error}</div> : null}
      </div>

      {activeOutput ? (
        <div className="px-panel response-output-box">
          <div className="response-title">
            <span className="px-plate">OUTPUT READY</span>
            <h2>
              {activeOutput.type === "ask"
                ? "Select Market Category"
                : `Mission Ready: ${activeOutput.data.skill?.label ?? "Negotiation"}`}
            </h2>
          </div>

          {activeOutput.type === "ask" ? (
            <div className="response-content">
              <p className="response-desc">The manager parsed your request, but needs to clarify the market category:</p>
              <div className="quest-chips">
                {activeOutput.data.options.map((o) => (
                  <button key={o.id} className="px-chip" onClick={() => submit(o.id)}>
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="response-content">
              <div className="response-details">
                <div className="detail-row">
                  <span className="label">Mission ID:</span>
                  <span className="val highlight">{activeOutput.data.mission_id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Target Market:</span>
                  <span className="val">
                    {activeOutput.data.skill?.emoji} {activeOutput.data.skill?.label}
                  </span>
                </div>
                {activeOutput.data.counterparties && (
                  <div className="detail-row">
                    <span className="label">Shops Briefed ({activeOutput.data.counterparties.length}):</span>
                    <span className="val">
                      {activeOutput.data.counterparties.map((c) => c.name).join(", ") || "Simulated Sellers"}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Execution Mode:</span>
                  <span className="val">{activeOutput.data.test ? "Test Redirect Mode" : "Live PSTN Calls"}</span>
                </div>
              </div>
              <div className="response-actions">
                <button
                  className="px-btn primary-action"
                  onClick={() => router.push(`/mission/${activeOutput.data.mission_id}`)}
                >
                  Enter Mission Office & Stream Calls →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <section className="level-select">
        <div className="level-head">
          <span className="px-label">Level select · {skills.length} markets installed</span>
          <button
            className="px-btn ghost"
            onClick={async () => {
              const r = await api.reloadSkills();
              setSkills((await api.skills()).skills);
              if (r.errors.length) setError(`${r.errors.length} skill file rejected: ${r.errors[0].message}`);
            }}
          >
            Reload skills
          </button>
        </div>

        <div className="level-grid">
          {skills.map((s) => (
            <button key={s.id} className="px-panel level-card" onClick={() => runDemo(s.id)} disabled={busy}>
              <span className="emoji">{s.emoji}</span>
              <span className="name">{s.label}</span>
              <span className="meta">
                negotiates {s.hero_metric.replace(/_/g, " ")} · demo plays vs simulated shops
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

/** Fill anything the classifier left out so a mission never fails on a missing area. */
function fillDefaults(spec: Record<string, string | number>, skill?: Skill): Record<string, string | number> {
  if (!skill) return spec;
  const out = { ...spec };
  for (const f of skill.mission_fields) {
    if (out[f.key] === undefined && f.default !== undefined) out[f.key] = f.default;
  }
  return out;
}

