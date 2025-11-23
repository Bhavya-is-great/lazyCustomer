// components/Loader.jsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "@/css/Components/globals/Loader.module.css";
import gsap from "gsap";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createProtectedStorage } from "@/utils/protectedStorage";

export default function Loader({ secretKey }) {
    // Create the protected storage helpers bound to the provided key
    const { protectedSet, protectedGet, protectedRemove } = createProtectedStorage(secretKey);

    const loaderRef = useRef(null);
    const ballRef = useRef(null);
    const bounceTweenRef = useRef(null);
    const rafRef = useRef(null);
    const startRef = useRef(0);
    const targetDurationRef = useRef(5000);
    const axiosDoneRef = useRef(false);
    const axiosDurationRef = useRef(null);
    const cancelledRef = useRef(false);

    const [progress, setProgress] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const loader = loaderRef.current;
        const ball = ballRef.current;
        if (!loader || !ball) return () => { };

        // capture initial path to know if user landed on /home directly
        const initialPath = window.location.pathname || "/";

        // detect navigation type (reload / navigate)
        const navEntries = performance.getEntriesByType("navigation");
        const navEntry = navEntries && navEntries.length ? navEntries[0] : null;
        const isFullReload = navEntry ? (navEntry.type === "reload" || navEntry.type === "navigate") : true;

        // read flags through protected storage (uses secretKey)
        const loggedFlag = protectedGet("loggedInUser") === true; // protected
        const playedFlag = protectedGet("loaderPlayed") === true; // protected
        const skipOnReloadFlag = protectedGet("skipLoaderOnReload") === true; // protected

        const isProductPage = initialPath.startsWith("/product");
        const skipGlobal = typeof window !== "undefined" && window.__skipLoaderNext === true;

        // If skipOnReload flag is set explicitly (protected), treat reloads as non-full reload
        const effectiveIsFullReload = isFullReload && !skipOnReloadFlag;

        // decide if animation should run
        const shouldRunAnimation = (!playedFlag || effectiveIsFullReload) && !skipGlobal && !isProductPage;

        // clear transient global quickly to avoid persistent effect
        if (typeof window !== "undefined" && window.__skipLoaderNext) {
            try { delete window.__skipLoaderNext; } catch (e) { }
        }

        // helper functions
        function startBounce() {
            bounceTweenRef.current = gsap.to(ball, {
                y: -500,
                duration: 1,
                repeat: -1,
                yoyo: true,
                ease: "bounce.in",
            });
        }

        function stopBounce() {
            if (bounceTweenRef.current) {
                try { bounceTweenRef.current.kill(); } catch (e) { }
                bounceTweenRef.current = null;
            }
        }

        function computeProgressFromT(t) {
            if (t <= 0) return 0;
            if (t < 0.6) {
                const nt = t / 0.6;
                // easeOutQuad mapped to 0..70
                return Math.floor((1 - (1 - nt) * (1 - nt)) * 70);
            } else if (t < 0.9) {
                const nt = (t - 0.6) / 0.3;
                // easeOutCubic mapped to 70..90
                return Math.floor(70 + (1 - Math.pow(1 - nt, 3)) * 20);
            } else if (t < 1.0) {
                const nt = (t - 0.9) / 0.1;
                return Math.floor(90 + Math.sqrt(nt) * 9);
            } else {
                return 99;
            }
        }

        function startProgressLoop() {
            startRef.current = performance.now();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(function frame(now) {
                if (cancelledRef.current) return;
                const elapsed = now - startRef.current;
                const t = Math.min(1, elapsed / targetDurationRef.current);
                const p = computeProgressFromT(t);
                setProgress(prev => Math.max(prev, p));
                rafRef.current = requestAnimationFrame(frame);
            });
        }

        async function growBallFromCenterCover() {
            stopBounce();
            // ensure perfect circle and pin to center
            const size = Math.max(ball.offsetWidth, ball.offsetHeight);
            gsap.set(ball, { width: size, height: size, borderRadius: "50%" });
            gsap.set(ball, { clearProps: "transform" });
            gsap.set(ball, {
                position: "fixed",
                left: "50%",
                top: "50%",
                xPercent: -50,
                yPercent: -50,
                transformOrigin: "center center",
            });

            const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            const maxDim = Math.sqrt(vw * vw + vh * vh);
            const scaleToCover = (maxDim * 1.2) / size;

            await gsap.to(ball, { scale: scaleToCover, duration: 0.65, ease: "power2.inOut" }).then();
            await new Promise(res => setTimeout(res, 800));
        }

        async function closeFlow(user) {
            try {
                setProgress(100);

                // grow cover
                await growBallFromCenterCover();

                if (user && user.id) {
                    // remember logged-in (protected) so future reloads can skip
                    try { protectedSet("loggedInUser", true); } catch (e) { }
                    try { protectedSet("loaderPlayed", true); } catch (e) { }

                    // mark skip for next SPA navigation
                    if (typeof window !== "undefined") {
                        window.__skipLoaderNext = true;
                        setTimeout(() => { try { delete window.__skipLoaderNext; } catch (e) { } }, 1000);
                    }

                    // navigate
                    if (typeof window !== "undefined" && window.barbaNavigate) {
                        try { await window.barbaNavigate("/home", "ball-morph"); } catch (e) { await router.push("/home"); }
                    } else {
                        try { await router.push("/home"); } catch (e) { if (typeof window !== "undefined") window.location.href = "/home"; }
                    }
                } else {
                    // if user not logged and landed on /home directly -> redirect to "/"
                    if (initialPath === "/home") {
                        try { await router.replace("/"); } catch (e) { if (typeof window !== "undefined") window.location.replace("/"); }
                    }
                }

                // settle and close loader container
                await new Promise(res => setTimeout(res, 200));
                await gsap.to(loader, { scale: 0, duration: 0.45, ease: "power2.in" }).then();
                if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
            } catch (e) {
                // cleanup fallback
                if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
            }
        }

        async function fastSkipFlow() {
            try {
                setProgress(100);
                if (loader) loader.style.display = "none";

                const res = await axios.get("/api/user", { withCredentials: true }).catch(() => null);
                const user = res && res.status >= 200 && res.status < 300 ? res.data : null;

                if (!user && initialPath === "/home") {
                    try { await router.replace("/"); } catch (e) { if (typeof window !== "undefined") window.location.replace("/"); }
                }

                if (user && user.id) {
                    try { protectedSet("loggedInUser", true); } catch (e) { }
                }
            } catch (e) { }
        }

        // main full flow runner
        async function runFullFlow() {
            startBounce();
            startProgressLoop();

            const axiosStart = performance.now();
            const axiosPromise = axios.get("/api/user", { withCredentials: true })
                .then(res => (res && res.status >= 200 && res.status < 300) ? res.data : null)
                .catch(() => null)
                .finally(() => {
                    const axiosEnd = performance.now();
                    axiosDoneRef.current = true;
                    axiosDurationRef.current = Math.max(0, axiosEnd - axiosStart);
                    targetDurationRef.current = Math.max(5000, axiosDurationRef.current);
                });

            // poll until both elapsed >= target AND axios done
            const poll = setInterval(async () => {
                if (cancelledRef.current) return;
                const elapsed = performance.now() - startRef.current;
                const target = targetDurationRef.current;
                if (elapsed >= target && axiosDoneRef.current) {
                    clearInterval(poll);
                    let user = null;
                    try { user = await axiosPromise; } catch (e) { user = null; }
                    setTimeout(() => { if (!cancelledRef.current) closeFlow(user); }, 45);
                }
            }, 100);

            // safety fallback
            const safety = setTimeout(() => {
                axiosDoneRef.current = true;
                targetDurationRef.current = Math.max(targetDurationRef.current, 30000);
            }, 30000);

            // keep references so cleanup can clear them
            // (they will be cleared in outer cleanup via cancelledRef)
        }

        // decide which path to run
        if (!shouldRunAnimation) {
            // skip visual animation path
            fastSkipFlow();
            return () => {
                cancelledRef.current = true;
                stopBounce();
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
        } else {
            // mark played (protected) so SPA navs don't re-run
            try { protectedSet("loaderPlayed", true); } catch (e) { }
            runFullFlow();
            return () => {
                cancelledRef.current = true;
                stopBounce();
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
        }
    }, [router, secretKey]); // secretKey included so storage helpers remain correct if key changes

    return (
        <section ref={loaderRef} className={styles.loader} style={{ transformOrigin: "center center" }}>
            <div className={styles.timer}>
                <h1 className={styles.text}>Loading...</h1>
                <div className={styles.load}>{progress}%</div>
            </div>
            <div ref={ballRef} className={styles.ball}></div>
        </section>
    );
}
