// app.js

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const matchSelect = document.getElementById("match-select");
    const globalPipelineStatus = document.getElementById("global-pipeline-status");
    const chatOutputs = document.getElementById("chat-outputs");
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const btnSpinner = document.getElementById("btn-spinner");
    const clearChatBtn = document.getElementById("clear-chat-btn");
    const suggestButtons = document.querySelectorAll(".prompt-btn");
    
    // Dashboard Components
    const phaseBarsContainer = document.getElementById("phase-bars-container");
    const matchupTableBody = document.getElementById("matchup-table-body");
    const playerChipsContainer = document.getElementById("player-chips");
    const playerAnalyticsContent = document.getElementById("player-analytics-content");
    
    // Chart Elements
    const canvas = document.getElementById("match-chart");
    const ctx = canvas.getContext("2d");
    const tooltip = document.getElementById("chart-tooltip");
    const zoomBtn = document.getElementById("zoom-18-20");
    const resetZoomBtn = document.getElementById("reset-zoom");
    
    // --- State Variables ---
    let currentMatchId = "t20wc_2022_ind_pak";
    let activeMatchData = null;
    let selectedPlayerId = "vk_kohli";
    let isZoomed = false;
    let isProcessing = false;
    let hoverIndex = -1;

    // --- Initialize App ---
    function init() {
        loadMatchData();
        renderDashboard();
        setupChart();
        bindEvents();
    }

    // --- Load Match Data ---
    function loadMatchData() {
        if (currentMatchId === "t20wc_2022_ind_pak" && typeof window.matchData !== "undefined") {
            activeMatchData = window.matchData;
        } else {
            // Emulate missing match data scenario
            activeMatchData = {
                match_id: null,
                teams: null,
                venue: null,
                format: null,
                innings: [],
                deliveries: [],
                player_stats: []
            };
        }
    }

    // --- Render Dashboard Panels ---
    function renderDashboard() {
        renderPhaseBars();
        renderMatchupTable();
        renderPlayerChips();
        renderPlayerAnalytics();
    }

    // 1. Innings Phase Bars
    function renderPhaseBars() {
        phaseBarsContainer.innerHTML = "";
        
        if (!activeMatchData.innings || activeMatchData.innings.length === 0) {
            phaseBarsContainer.innerHTML = `<div class="loading-placeholder">[MISSING: phase_breakdown]</div>`;
            return;
        }

        activeMatchData.innings.forEach(inning => {
            const team = inning.batting_team;
            const teamClass = team === "India" ? "ind" : "pak";
            const phaseTitle = `${team} Innings Phases`;
            
            const section = document.createElement("div");
            section.className = "innings-phase-section";
            section.innerHTML = `<h4 style="font-size: 0.75rem; margin-top: 0.5rem; color: var(--text-secondary);">${phaseTitle}</h4>`;
            
            const pp = inning.phase_breakdown.powerplay;
            const mid = inning.phase_breakdown.middle;
            const death = inning.phase_breakdown.death;
            
            const createBar = (phaseName, runs, wickets, rr) => {
                const percentage = Math.min((runs / 100) * 100, 100);
                return `
                    <div class="phase-row" style="margin-top: 0.35rem;">
                        <div class="phase-label-row">
                            <span class="phase-label">${phaseName}</span>
                            <span class="phase-stats">${runs}/${wickets} (${rr} RR)</span>
                        </div>
                        <div class="phase-bar-track">
                            <div class="phase-bar-fill ${teamClass}" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            };
            
            section.innerHTML += createBar("Powerplay (Overs 1-6)", pp.runs, pp.wickets, pp.rr);
            section.innerHTML += createBar("Middle (Overs 7-15)", mid.runs, mid.wickets, mid.rr);
            section.innerHTML += createBar("Death (Overs 16-20)", death.runs, death.wickets, death.rr);
            
            phaseBarsContainer.appendChild(section);
        });
    }

    // 2. Bowler-Batter Matchup Table
    function renderMatchupTable() {
        matchupTableBody.innerHTML = "";
        
        if (!activeMatchData.player_stats || activeMatchData.player_stats.length === 0) {
            matchupTableBody.innerHTML = `<tr><td colspan="6" class="text-center">[MISSING: matchup_stats]</td></tr>`;
            return;
        }

        let rowCount = 0;
        activeMatchData.player_stats.forEach(player => {
            if (player.team === "India") { // For UI cleanliness, showcase the chasing matchups
                Object.keys(player.matchup_stats).forEach(bowlerName => {
                    const stats = player.matchup_stats[bowlerName];
                    const risk = stats.sr > 150 ? "LOW" : (stats.sr < 115 ? "HIGH" : "MEDIUM");
                    const riskClass = risk.toLowerCase();
                    
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td style="font-weight: 600;">${player.name}</td>
                        <td>${bowlerName}</td>
                        <td>${stats.runs} (${stats.balls})</td>
                        <td>${stats.dismissals}</td>
                        <td>${stats.sr.toFixed(1)}</td>
                        <td><span class="risk-badge ${riskClass}">${risk}</span></td>
                    `;
                    matchupTableBody.appendChild(row);
                    rowCount++;
                });
            }
        });
        
        if (rowCount === 0) {
            matchupTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No matchups available</td></tr>`;
        }
    }

    // 3. Player Chips
    function renderPlayerChips() {
        playerChipsContainer.innerHTML = "";
        
        if (!activeMatchData.player_stats || activeMatchData.player_stats.length === 0) {
            return;
        }

        activeMatchData.player_stats.forEach(player => {
            const chip = document.createElement("button");
            chip.className = `player-chip ${player.player_id === selectedPlayerId ? "active" : ""}`;
            chip.textContent = player.name;
            chip.addEventListener("click", () => {
                selectedPlayerId = player.player_id;
                renderPlayerChips();
                renderPlayerAnalytics();
            });
            playerChipsContainer.appendChild(chip);
        });
    }

    // 4. Live Player Analytics Center
    function renderPlayerAnalytics() {
        playerAnalyticsContent.innerHTML = "";
        
        if (!activeMatchData.player_stats || activeMatchData.player_stats.length === 0) {
            playerAnalyticsContent.innerHTML = `<div class="empty-state">[MISSING: player_stats]</div>`;
            return;
        }

        const player = activeMatchData.player_stats.find(p => p.player_id === selectedPlayerId);
        if (!player) return;

        const perf = player.match_performance;
        
        playerAnalyticsContent.innerHTML = `
            <div class="player-perf-column">
                <div class="player-name-title">${player.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${player.team} • Batting Performance</div>
                <div class="player-stat-grid">
                    <div class="stat-box">
                        <div class="stat-val">${perf.runs}</div>
                        <div class="stat-lbl">Runs Scored</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-val">${perf.balls}</div>
                        <div class="stat-lbl">Balls Faced</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-val">${perf.sr.toFixed(1)}</div>
                        <div class="stat-lbl">Strike Rate</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-val">${perf.fours}s / ${perf.sixes}s</div>
                        <div class="stat-lbl">4s / 6s</div>
                    </div>
                </div>
            </div>
            <div class="player-perf-column">
                <div class="player-match-outcome-box">
                    <h4>Match Dismissal</h4>
                    <p>${perf.dismissal}</p>
                </div>
                <div class="player-stat-grid" style="margin-top: 0.5rem;">
                    <div class="stat-box">
                        <div class="stat-val">${player.career_avg}</div>
                        <div class="stat-lbl">Career Avg</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-val">${player.venue_avg}</div>
                        <div class="stat-lbl">Venue Avg</div>
                    </div>
                </div>
                <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.35rem;">
                    Last 5 Inning Scores: [ ${player.last_5_scores.join(", ")} ]
                </div>
            </div>
        `;
    }

    // --- Interactive Chart Renderer (Canvas) ---
    function setupChart() {
        const resizeCanvas = () => {
            const rect = canvas.parentNode.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            drawChart();
        };
        
        window.addEventListener("resize", resizeCanvas);
        // Delay slight bit to ensure rect dimensions are painted
        setTimeout(resizeCanvas, 50);
    }

    function getChartData() {
        if (!activeMatchData.deliveries || activeMatchData.deliveries.length === 0) {
            return [];
        }
        
        if (isZoomed) {
            // Filter to deliveries between over 18 (17.0) and over 20 (19.6)
            return activeMatchData.deliveries.filter(d => d.over >= 17);
        }
        
        return activeMatchData.deliveries;
    }

    function drawChart() {
        const data = getChartData();
        const w = canvas.width / window.devicePixelRatio;
        const h = canvas.height / window.devicePixelRatio;
        
        ctx.clearRect(0, 0, w, h);
        
        if (data.length === 0) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px Space Grotesk";
            ctx.textAlign = "center";
            ctx.fillText("[MISSING: win_probability_series]", w / 2, h / 2);
            return;
        }

        const paddingLeft = 40;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 30;
        
        const graphW = w - paddingLeft - paddingRight;
        const graphH = h - paddingTop - paddingBottom;

        // Draw grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        
        // Horizontal lines (Y-axis grid representing %)
        const gridLines = [0.25, 0.5, 0.75];
        gridLines.forEach(ratio => {
            const y = paddingTop + graphH * ratio;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(w - paddingRight, y);
            ctx.stroke();
            
            ctx.fillStyle = "#475569";
            ctx.font = "10px Outfit";
            ctx.textAlign = "right";
            ctx.fillText(`${Math.round((1 - ratio) * 100)}%`, paddingLeft - 8, y + 3);
        });

        // Draw x-axis labels
        const totalPoints = data.length;
        const xStep = graphW / (totalPoints - 1);
        
        // Show labels (Overs)
        const labelInterval = isZoomed ? 2 : Math.max(Math.round(totalPoints / 6), 1);
        for (let i = 0; i < totalPoints; i += labelInterval) {
            const x = paddingLeft + i * xStep;
            const d = data[i];
            
            ctx.beginPath();
            ctx.moveTo(x, paddingTop);
            ctx.lineTo(x, h - paddingBottom);
            ctx.stroke();
            
            ctx.fillStyle = "#475569";
            ctx.font = "10px Outfit";
            ctx.textAlign = "center";
            ctx.fillText(`${d.over}.${d.ball || 1}`, x, h - paddingBottom + 14);
        }

        // Draw 50% Win Probability threshold
        ctx.strokeStyle = "rgba(0, 210, 255, 0.15)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, paddingTop + graphH / 2);
        ctx.lineTo(w - paddingRight, paddingTop + graphH / 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw Momentum Area Chart (fill from bottom/middle)
        ctx.beginPath();
        data.forEach((d, idx) => {
            const x = paddingLeft + idx * xStep;
            // Scale momentum (0-100) to Y axis
            const y = paddingTop + graphH * (1 - d.mom / 100);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(paddingLeft + (totalPoints - 1) * xStep, h - paddingBottom);
        ctx.lineTo(paddingLeft, h - paddingBottom);
        ctx.closePath();
        const momGrad = ctx.createLinearGradient(0, paddingTop, 0, h - paddingBottom);
        momGrad.addColorStop(0, "rgba(168, 85, 247, 0.15)");
        momGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
        ctx.fillStyle = momGrad;
        ctx.fill();

        ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        data.forEach((d, idx) => {
            const x = paddingLeft + idx * xStep;
            const y = paddingTop + graphH * (1 - d.mom / 100);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw INDIA Win Probability Curve (Chasing)
        const indPoints = data.map((d, idx) => ({
            x: paddingLeft + idx * xStep,
            y: paddingTop + graphH * (1 - d.win_prob / 100),
            val: d.win_prob
        }));
        
        ctx.strokeStyle = "var(--accent-blue-neon)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "var(--accent-blue-glow)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        indPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow

        // Draw PAKISTAN Win Probability Curve (Mirror)
        const pakPoints = data.map((d, idx) => ({
            x: paddingLeft + idx * xStep,
            y: paddingTop + graphH * (d.win_prob / 100), // Mirror of India
            val: 100 - d.win_prob
        }));
        
        ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pakPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Highlight critical wicket event dots
        data.forEach((d, idx) => {
            if (d.wicket) {
                const x = paddingLeft + idx * xStep;
                const yInd = paddingTop + graphH * (1 - d.win_prob / 100);
                
                // Draw glow circle
                ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
                ctx.beginPath();
                ctx.arc(x, yInd, 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "var(--danger-red)";
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(x, yInd, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        });

        // Hover guide lines & dot
        if (hoverIndex >= 0 && hoverIndex < data.length) {
            const hPt = indPoints[hoverIndex];
            
            // Vertical guide line
            ctx.strokeStyle = "rgba(0, 210, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hPt.x, paddingTop);
            ctx.lineTo(hPt.x, h - paddingBottom);
            ctx.stroke();
            
            // Highlight dot
            ctx.fillStyle = "var(--accent-blue-neon)";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(hPt.x, hPt.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    // --- Chart Mouse Interactions ---
    function handleChartMouseMove(e) {
        const data = getChartData();
        if (data.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const xMouse = e.clientX - rect.left;
        const yMouse = e.clientY - rect.top;

        const paddingLeft = 40;
        const paddingRight = 20;
        const graphW = rect.width - paddingLeft - paddingRight;
        const xStep = graphW / (data.length - 1);

        // Find nearest index
        let index = Math.round((xMouse - paddingLeft) / xStep);
        index = Math.max(0, Math.min(data.length - 1, index));

        if (index !== hoverIndex) {
            hoverIndex = index;
            drawChart();
            showTooltip(e, data[index]);
        }
    }

    function showTooltip(e, d) {
        const rect = canvas.getBoundingClientRect();
        const containerRect = canvas.parentNode.getBoundingClientRect();
        
        // Format content
        let content = `
            <strong>Over ${d.over}.${d.ball || 1}</strong><br>
            Batter: ${d.batter}<br>
            Bowler: ${d.bowler}<br>
            Runs: ${d.runs} ${d.detail ? `(${d.detail})` : ""}<br>
            ${d.wicket ? `<span style="color:var(--danger-red)">WICKET: ${d.wicket}</span><br>` : ""}
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 4px 0;">
            <span style="color:var(--accent-blue-neon)">IND Win Prob: ${d.win_prob}%</span><br>
            <span style="color:var(--success-green)">PAK Win Prob: ${100 - d.win_prob}%</span><br>
            <span style="color:#a855f7">Momentum: ${d.mom}</span>
        `;
        
        tooltip.innerHTML = content;
        tooltip.classList.remove("hidden");
        
        // Calculate position relative to container
        const x = e.clientX - containerRect.left + 15;
        const y = e.clientY - containerRect.top + 15;
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    function hideTooltip() {
        hoverIndex = -1;
        drawChart();
        tooltip.classList.add("hidden");
    }

    // --- Gemma 4 E4B Simulation Engine ---
    function simulatePipeline(query) {
        if (isProcessing) return;
        isProcessing = true;
        
        // UI states
        globalPipelineStatus.textContent = "Processing";
        globalPipelineStatus.style.background = "rgba(0, 210, 255, 0.15)";
        sendBtn.disabled = true;
        btnSpinner.style.display = "block";
        
        // Reset steps UI
        const steps = ["planner", "data", "analytics", "prediction", "explanation"];
        steps.forEach(s => {
            const el = document.getElementById(`step-${s}`);
            el.className = "pipeline-step";
            el.querySelector(".step-status").textContent = "Idle";
            document.getElementById(`telemetry-${s}`).textContent = "";
        });

        // Add user query to chat outputs
        appendMessage(query, "user");

        // Start Pipeline steps sequentially
        runStepPlanner(query);
    }

    function appendMessage(text, sender, stagesData = null) {
        const msg = document.createElement("div");
        msg.className = `chat-message ${sender}`;
        
        if (sender === "user") {
            msg.innerHTML = `<p>${text}</p>`;
        } else if (stagesData) {
            // Render structured reasoning blocks
            msg.innerHTML = "";
            
            const createBlock = (label, content, boxClass) => {
                return `
                    <div class="chat-message-stage ${boxClass}">
                        <h4>${label}</h4>
                        ${content}
                    </div>
                `;
            };

            // Stage 1 Planner
            const plannerContent = `
                <p><strong>Decomposing:</strong></p>
                <ol style="margin-left: 1.2rem; margin-top: 0.2rem;">
                    ${stagesData.planner.map(t => `<li>${t}</li>`).join("")}
                </ol>
            `;
            msg.innerHTML += createBlock("[PLANNER]", plannerContent, "planner-box");

            // Stage 2 Data Retrieval
            let dataContent = "";
            if (stagesData.data_warning) {
                dataContent += `<p style="color:var(--warning-orange); font-weight:700;">[DATA WARNING]: Fewer than 50% of expected delivery fields present.</p>`;
            }
            dataContent += `<p><strong>Match Metadata:</strong> ${stagesData.data.metadata}</p>`;
            dataContent += `<p><strong>Innings Summary:</strong> ${stagesData.data.innings}</p>`;
            dataContent += `<p><strong>Ball-by-Ball Log:</strong> ${stagesData.data.log}</p>`;
            dataContent += `<p><strong>Player Performance Table:</strong> ${stagesData.data.player_stats}</p>`;
            dataContent += `<p><strong>Win Probability Series:</strong> ${stagesData.data.win_prob}</p>`;
            msg.innerHTML += createBlock("[DATA RETRIEVAL]", dataContent, "data-box");

            // Stage 3 Analytics
            const analyticsContent = stagesData.analytics.map(line => `<p>${line}</p>`).join("");
            msg.innerHTML += createBlock("[ANALYTICS]", analyticsContent, "analytics-box");

            // Stage 4 Prediction
            const predContent = `
                <p><strong>Counterfactual:</strong> ${stagesData.prediction.counterfactual}</p>
                <p><strong>Forward Projection:</strong> ${stagesData.prediction.forward}</p>
            `;
            msg.innerHTML += createBlock("[PREDICTION]", predContent, "prediction-box");

            // Stage 5 Explanation
            const expContent = `<p style="font-style: italic; line-height: 1.5;">${stagesData.explanation}</p>`;
            msg.innerHTML += createBlock("[EXPLANATION]", expContent, "explanation-box");
        } else {
            msg.innerHTML = `<p>${text}</p>`;
        }
        
        chatOutputs.appendChild(msg);
        chatOutputs.scrollTop = chatOutputs.scrollHeight;
    }

    // Step 1: Planner
    function runStepPlanner(query) {
        const el = document.getElementById("step-planner");
        el.className = "pipeline-step active";
        el.querySelector(".step-status").textContent = "Analyzing";
        
        const tele = document.getElementById("telemetry-planner");
        tele.textContent = "DECOMPOSING QUERY...\n- Parsed keywords: " + query.toLowerCase().split(" ").slice(0,4).join(", ") + "\n- Launching execution schedule.";

        setTimeout(() => {
            el.className = "pipeline-step completed";
            el.querySelector(".step-status").textContent = "Completed";
            tele.textContent = "Tasks created successfully.\n- Job 1: Fetch match data\n- Job 2: Run matchups/phases\n- Job 3: Compute leverage";
            
            runStepData(query);
        }, 800);
    }

    // Step 2: Data Retrieval
    function runStepData(query) {
        const el = document.getElementById("step-data");
        el.className = "pipeline-step active";
        el.querySelector(".step-status").textContent = "Fetching";
        
        const tele = document.getElementById("telemetry-data");
        tele.textContent = "VALIDATING DATA CONTRACT...\n- Checking deliveries\n- Checking statistics";

        setTimeout(() => {
            const hasData = activeMatchData.match_id !== null;
            el.className = "pipeline-step completed";
            el.querySelector(".step-status").textContent = "Completed";
            
            if (hasData) {
                tele.textContent = "DATA INTEGRITY OK.\n- Loaded: " + activeMatchData.deliveries.length + " deliveries\n- Loaded: " + activeMatchData.player_stats.length + " players";
            } else {
                tele.textContent = "DATA INTEGRITY ERROR.\n- Missing deliveries (0% present)\n- Emitting [DATA WARNING]";
            }
            
            runStepAnalytics(query, hasData);
        }, 800);
    }

    // Step 3: Analytics
    function runStepAnalytics(query, hasData) {
        const el = document.getElementById("step-analytics");
        el.className = "pipeline-step active";
        el.querySelector(".step-status").textContent = "Computing";
        
        const tele = document.getElementById("telemetry-analytics");
        tele.textContent = "RUNNING HEURISTICS...\n- Calculating phase RR\n- Running matchups";

        setTimeout(() => {
            el.className = "pipeline-step completed";
            el.querySelector(".step-status").textContent = "Completed";
            tele.textContent = "Calculations finalized.\n- Inflection point matched\n- Momentum trends computed";
            
            runStepPrediction(query, hasData);
        }, 800);
    }

    // Step 4: Prediction
    function runStepPrediction(query, hasData) {
        const el = document.getElementById("step-prediction");
        el.className = "pipeline-step active";
        el.querySelector(".step-status").textContent = "Predicting";
        
        const tele = document.getElementById("telemetry-prediction");
        tele.textContent = "SIMULATING ALTERNATES...\n- Calculating win prob shifts\n- Scoring next game vulnerabilities";

        setTimeout(() => {
            el.className = "pipeline-step completed";
            el.querySelector(".step-status").textContent = "Completed";
            tele.textContent = "Scenarios evaluated.\n- Counterfactual WP delta solved\n- Vulnerability factor ready";
            
            runStepExplanation(query, hasData);
        }, 800);
    }

    // Step 5: Gemma Explanation & Final Assembly
    function runStepExplanation(query, hasData) {
        const el = document.getElementById("step-explanation");
        el.className = "pipeline-step active";
        el.querySelector(".step-status").textContent = "Generating";
        
        const tele = document.getElementById("telemetry-explanation");
        tele.textContent = "INTEGRATING LOGS...\n- Formatting Gemma response\n- Auditing structure";

        setTimeout(() => {
            el.className = "pipeline-step completed";
            el.querySelector(".step-status").textContent = "Completed";
            tele.textContent = "Analysis assembled successfully.";
            
            // Build the dynamic multi-agent output package based on data availability and keywords
            const packageData = compilePipelineData(query, hasData);
            appendMessage(null, "ai", packageData);
            
            // Re-render chart to reflect potential changes, reset controls
            drawChart();
            
            // Finalize state
            isProcessing = false;
            globalPipelineStatus.textContent = "Completed";
            globalPipelineStatus.style.background = "rgba(16, 185, 129, 0.15)";
            globalPipelineStatus.style.color = "var(--success-green)";
            sendBtn.disabled = false;
            btnSpinner.style.display = "none";
        }, 800);
    }

    // --- Dynamic Heuristic Intelligence (Gemma 4 E4B Engine) ---
    function compilePipelineData(query, hasData) {
        const q = query.toLowerCase();
        
        // Scenario 1: Empty match dataset (Custom query mode, missing data)
        if (!hasData) {
            return {
                data_warning: true,
                planner: [
                    "Fetch all match data, player stats, and delivery records from query context.",
                    "Identify Virat Kohli's batting performance and dismissal details.",
                    "Calculate performance gap metrics and matchup statistics.",
                    "Perform counterfactual prediction and identify potential future weaknesses.",
                    "Generate the explanation layer based on the previous stages."
                ],
                data: {
                    metadata: "[MISSING: match_id], [MISSING: teams], [MISSING: venue], [MISSING: format]",
                    innings: "[MISSING: innings]",
                    log: "[MISSING: deliveries]",
                    player_stats: "[MISSING: player_stats]",
                    win_prob: "[MISSING: win_probability]"
                },
                analytics: [
                    "Performance Gap Calculation:",
                    "Actual Runs = [MISSING: actual_runs]",
                    "Career Average = [MISSING: career_avg]",
                    "Performance Gap = Actual Runs - Career Average = Undefined",
                    "Bowler-Batter Matchup Calculation:",
                    "Dismissal Bowler Average vs Batter = [MISSING: matchup_stats]",
                    "Batter Strike Rate vs Bowler = [MISSING: matchup_stats]",
                    "Win Probability Inflection Calculation:",
                    "Pre-delivery Win Probability = [MISSING: win_probability]",
                    "Post-delivery Win Probability = [MISSING: win_probability]",
                    "Delta Win Probability = Pre-delivery Win Probability - Post-delivery Win Probability = Undefined"
                ],
                prediction: {
                    counterfactual: "Due to missing match data, a specific intervention cannot be identified. Win probability delta is estimated at +0.0% due to lack of baseline data.",
                    forward: "Because no team or player performance patterns can be extracted from the empty context, the predicted weakness is undefined, and the recurrence probability is set to 0.0 with 0% confidence."
                },
                explanation: "No verdict can be reached on Virat Kohli's performance because the match data is entirely missing from the query context. The turning point of our analysis is the empty JSON input, leaving us without the exact over, ball, or bowler of his dismissal. The numbers that tell the story are 0 deliveries tracked, 0 runs recorded, and a 100% data deficit. Had the structured match JSON been provided, we could have run the counterfactual to quantify the exact win probability shift. The takeaway is clear: provide the expected match data format so we can run the numbers and dissect Kohli's performance."
            };
        }

        // Scenario 2: Active India vs Pakistan WC 2022 Match Data Loaded
        let plannerTasks = [
            "Fetch match metadata, innings summaries, and full ball-by-ball logs from the Pakistan innings and India chase.",
            "Deconstruct wicket clusters in the powerplays and calculate boundary drought over ranges.",
            "Solve the win probability inflection point where India dipped to its lowest point and identify the trigger.",
            "Analyze Virat Kohli's matchups against Haris Rauf and Shaheen Afridi to determine leverage boundaries.",
            "Synthesize analytics into a sharp cricket analyst verdict under 200 words."
        ];
        
        let metadataStr = "match_id: t20wc_2022_ind_pak | venue: MCG | teams: IND, PAK | format: T20I";
        let inningsStr = "PAK: 159/8 (20 overs) | IND: 160/6 (20 overs)";
        let logStr = "120 deliveries tracked (filtered to 54 key chasing balls)";
        let statsStr = "Loaded records for Virat Kohli, Hardik Pandya, Babar Azam, Mohammad Rizwan";
        let winProbStr = "Complete 120-point chase series synced";

        // Query Routing & Tailoring
        if (q.includes("pakistan lose") || q.includes("pakistan lost") || q.includes("why did pak")) {
            return {
                data_warning: false,
                planner: plannerTasks,
                data: { metadata: metadataStr, innings: inningsStr, log: logStr, player_stats: statsStr, win_prob: winProbStr },
                analytics: [
                    "Innings Phase Breakdown Calculation (Pakistan):",
                    "Powerplay Run Rate = 32 runs / 6 overs = 5.33 RR (Wickets lost = 2)",
                    "Death Over Run Rate = 61 runs / 5 overs = 12.2 RR (Wickets lost = 4)",
                    "Momentum Shift Detection (Pakistan batting):",
                    "Over range 1-4: Run rate dropped to 3.75 RR (15 runs off 24 balls, 2 wickets lost)",
                    "Performance Gap Analysis (Pakistan Top Order):",
                    "Babar Azam: Actual (0) vs Career Avg (41.41) = -41.41 Runs",
                    "Mohammad Rizwan: Actual (4) vs Career Avg (48.82) = -44.82 Runs",
                    "Bowler Matchup Impact (Arshdeep Singh):",
                    "Arshdeep Singh vs Babar Azam: 1 ball, 1 dismissal, 0.0 SR"
                ],
                prediction: {
                    counterfactual: "If Babar Azam had negotiated Arshdeep Singh's opening spell and survived the first 4 overs, Pakistan's expected score would have risen by 18 runs, shifting India's chasing win probability down by 14.5% (from 50.0% to 35.5%).",
                    forward: "Pakistan's primary vulnerability remains top-order susceptibility against high-quality swing in the powerplay. Recurrence probability for the next match on a seam-friendly deck: 0.72."
                },
                explanation: "Top-order paralysis cost Pakistan the match, as losing Babar Azam and Mohammad Rizwan for just four runs combined left their middle order exposed. The turning point occurred at 0.1 overs when Arshdeep Singh trapped Babar lbw on his first delivery, immediately crushing Pakistan's powerplay momentum. The numbers show Babar's massive -41.41 performance gap, a slow middle-overs crawl of 7.33 run rate, and Pakistan's powerplay ending at an underwhelming 32/2. Had Pakistan's openers survived the first four overs, their projected score would have risen by 18 runs, making the chase mathematically out of India's reach. Going forward, Babar's men must address their vulnerability against opening-over swing to avoid early collapse."
            };
        } 
        
        if (q.includes("babar") || q.includes("underperform")) {
            return {
                data_warning: false,
                planner: [
                    "Fetch Babar Azam's career statistics, venue performance, and match deliveries.",
                    "Isolate Babar's matchup history against Arshdeep Singh and Bhuvneshwar Kumar.",
                    "Calculate the performance gap between Babar's expectations and actual dismissal.",
                    "Predict counterfactual projections of Pakistan's innings length had Babar anchored.",
                    "Explain Babar's tactical errors in plain analyst English."
                ],
                data: { metadata: metadataStr, innings: inningsStr, log: "1 delivery tracked (Babar Azam bat)", player_stats: statsStr, win_prob: winProbStr },
                analytics: [
                    "Babar Azam Performance Gap Calculation:",
                    "Match score = 0 runs (1 ball faced)",
                    "Career Average = 41.41 runs | Career SR = 129.12",
                    "Performance Gap = 0 - 41.41 = -41.41 Runs",
                    "Matchup History (Arshdeep vs Babar):",
                    "Total deliveries = 8 balls | Runs conceded = 4 | Dismissals = 2",
                    "Strike Rate = 50.0 | Dismissal Rate = 25.0%"
                ],
                prediction: {
                    counterfactual: "Had Babar Azam successfully reviewed his LBW decision or adjusted his footwork to negate Arshdeep's inswinger, his average anchoring innings length would have pushed Pakistan past 170. Win probability delta: +12.0%.",
                    forward: "Babar's technique against left-arm inswinging fuller deliveries in the opening over will be targetted. Recurrence probability of early dismissal: 0.65."
                },
                explanation: "Babar Azam's golden duck was the catalytic anchor that dragged down Pakistan's projected total by nearly 20 runs. The turning point was over 0.1, when Arshdeep Singh's full, inswinging delivery beat Babar's front foot defense, trapping him plumb leg-before. The numbers tell a stark story: Babar registered a massive -41.41 run performance gap, a 0.0 strike rate, and average matchup score of 50.0 against Arshdeep. Had Babar survived that opening ball, Pakistan's projected score would have leaped to 175. The takeaway is clear: Babar must refine his front-foot trigger movement against left-arm swing to keep Pakistan's next powerplay intact."
            };
        }

        if (q.includes("19th over") || q.includes("what if kohli") || q.includes("rauf") || q.includes("nawaz")) {
            return {
                data_warning: false,
                planner: [
                    "Retrieve detailed ball-by-ball logs for overs 18, 19, and 20 of the Indian innings.",
                    "Calculate the run rate required versus actual run rate during Haris Rauf's 19th over.",
                    "Determine the win probability inflection point trigger on delivery 18.5.",
                    "Run counterfactual simulations of Kohli getting dismissed on the fifth delivery of over 19.",
                    "Formulate a detailed, engaging breakdown of the death-over robbery."
                ],
                data: { metadata: metadataStr, innings: inningsStr, log: "Overs 18-20 detailed ball logs loaded", player_stats: statsStr, win_prob: winProbStr },
                analytics: [
                    "Win Probability Inflection Calculation (Over 19):",
                    "18.4 delivery: 28 runs needed off 8 balls. India Win Probability = 5.0%",
                    "18.5 delivery: Kohli hits Haris Rauf for straight six. India Win Probability = 18.0% (Delta = +13.0%)",
                    "18.6 delivery: Kohli hits flick six. India Win Probability = 38.0% (Delta = +20.0%)",
                    "Momentum calculation during Over 19:",
                    "Runs scored off Rauf = 15 | Momentum rating peak = 98/100"
                ],
                prediction: {
                    counterfactual: "If Virat Kohli had failed to connect or had been caught on delivery 18.5, India's win probability would have plunged to 1.5%. His two sixes represent a massive +33.0% win probability delta, making this the highest-leverage sequence of the World Cup.",
                    forward: "Opponents will exploit high-pace back-of-length deliveries against Kohli's partners, attempting to isolate Kohli in chases. Recurrence probability: 0.58."
                },
                explanation: "Virat Kohli's back-to-back sixes off Haris Rauf in the nineteenth over snatched victory from the jaws of absolute mathematical defeat. The turning point was over 18.5 when Kohli punched a back-of-length delivery straight back over Rauf's head for six, breaking Pakistan's defensive chokehold. The numbers are staggering: India's win probability stood at a microscopic 5% before that ball, shot to 38% by the over's end, and capitalized on 15 runs off Rauf. Had Kohli been caught on 18.5, Pakistan would have coasted to a 98.5% certain win. The takeaway: Kohli's masterclass proves chasing pressure is a mental construct when elite strike-rotation is backed by boundary genius."
            };
        }

        // Generic query fallback (Kohli / general match analysis)
        return {
            data_warning: false,
            planner: plannerTasks,
            data: { metadata: metadataStr, innings: inningsStr, log: logStr, player_stats: statsStr, win_prob: winProbStr },
            analytics: [
                "Win Probability Inflection Calculation:",
                "Pre-inflection: Over 6.1 (India 31/4). Win Probability = 15.0%",
                "Post-inflection: Over 19.4 (India 154/5). Win Probability = 65.0%",
                "Performance Gap Analysis (Virat Kohli):",
                "Actual runs = 82* (53 balls, 6x4, 4x6)",
                "Career Average = 52.73 | Venue Average = 78.5",
                "Performance Gap = 82.0 - 52.73 = +29.27 Runs",
                "Matchup Analysis (Kohli vs Haris Rauf):",
                "Runs scored = 42 | Balls faced = 24 | Dismissals = 0 | SR = 175.0"
            ],
            prediction: {
                counterfactual: "If the Kohli-Pandya partnership was broken during the middle overs (overs 7-15) where India operated at 7.67 RR, India's chase would have collapsed, leading to an estimated 45-run defeat. Win probability delta: -35.0%.",
                forward: "India's middle-order stability heavily relies on Kohli anchoring while partners hit. If top-order collapses recur, next match win probability is heavily contingent on Kohli's survival. Recurrence probability: 0.75."
            },
            explanation: "Virat Kohli's majestic 82* pulled off a heist, rescuing India from a disastrous powerplay collapse. The turning point was over 18.5 when Kohli struck Haris Rauf for a straight six, triggering an inflection that lifted India's win probability from 5% to a competitive 38% in two balls. The numbers showcase Kohli's +29.27 performance gap, his dominant 175.0 strike rate against Haris Rauf, and a crucial 113-run recovery partnership. Had Kohli fallen in the powerplay, India would have succumbed to a heavy 40+ run defeat. The takeaway is clear: India's top-order frailty under swing remains their major roadblock, placing unsustainable pressure on Kohli's anchoring genius."
        };
    }

    // --- Helper for Typewriter effect or streaming rendering ---
    function bindEvents() {
        // Chat Form Submission
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const query = userInput.value.trim();
            if (query && !isProcessing) {
                simulatePipeline(query);
                userInput.value = "";
            }
        });

        // Suggested Prompt Clicks
        suggestButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const query = btn.getAttribute("data-query");
                if (query && !isProcessing) {
                    simulatePipeline(query);
                }
            });
        });

        // Clear Logs
        clearChatBtn.addEventListener("click", () => {
            chatOutputs.innerHTML = `
                <div class="system-message">
                    <p><strong>System Initialization:</strong> Chat logs cleared. Ready to accept queries.</p>
                </div>
            `;
        });

        // Match Selection Change
        matchSelect.addEventListener("change", () => {
            currentMatchId = matchSelect.value;
            loadMatchData();
            renderDashboard();
            isZoomed = false;
            zoomBtn.classList.remove("active");
            resetZoomBtn.classList.add("active");
            drawChart();
            
            appendMessage(`Switching to match state: ${matchSelect.options[matchSelect.selectedIndex].text}. Dashboard synchronized.`, "system");
        });

        // Chart Interactive Hover
        canvas.addEventListener("mousemove", handleChartMouseMove);
        canvas.addEventListener("mouseleave", hideTooltip);
        
        // Touch events support for mobile
        canvas.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                handleChartMouseMove(e.touches[0]);
            }
        });
        canvas.addEventListener("touchend", hideTooltip);

        // Zoom Controls
        zoomBtn.addEventListener("click", () => {
            isZoomed = true;
            zoomBtn.classList.add("active");
            resetZoomBtn.classList.remove("active");
            hoverIndex = -1;
            drawChart();
        });

        resetZoomBtn.addEventListener("click", () => {
            isZoomed = false;
            zoomBtn.classList.remove("active");
            resetZoomBtn.classList.add("active");
            hoverIndex = -1;
            drawChart();
        });
    }

    // Launch Application
    init();
});
