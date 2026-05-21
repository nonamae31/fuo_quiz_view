// State management
let currentData = null;
let currentZipPath = null;
let currentExamIndex = 0;
let currentQuestionIndex = 0;
// Store completed exam identifiers (exam.name) instead of array indexes
let completedExams = new Set();


// Zoom state
let zoomLevel = 1;
let isDragging = false;
let currentTranslateX = 0;
let currentTranslateY = 0;
let startDragX = 0;
let startDragY = 0;
let isZoomLocked = false;
let isPositionPinned = false;
let reviewList = [];
let isReviewMode = false;
let currentReviewIndex = -1;
let currentFilteredIndex = -1;

// DOM elements
const openZipBtn = document.getElementById("openZipBtn");
const dropZone = document.getElementById("dropZone"); // New drop zone
const welcomeScreen = document.getElementById("welcomeScreen");
const viewerContent = document.getElementById("viewerContent");
const examList = document.getElementById("examList");
const examCount = document.getElementById("examCount");
const currentExamName = document.getElementById("currentExamName");
const examAttachments = document.getElementById("examAttachments");
const questionCount = document.getElementById("questionCount");
const questionIndicator = document.getElementById("questionIndicator");
const questionImage = document.getElementById("questionImage");
const commentContent = document.getElementById("commentContent");
const prevQuestionBtn = document.getElementById("prevQuestionBtn");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");

// Fullscreen elements
const fullscreenModal = document.getElementById("fullscreenModal");
const fullscreenImage = document.getElementById("fullscreenImage");
const fullscreenClose = document.getElementById("fullscreenClose");
const fsQuestionIndicator = document.getElementById("fsQuestionIndicator");
const fsPrevBtn = document.getElementById("fsPrevBtn");
const fsNextBtn = document.getElementById("fsNextBtn");
const fsToggleComments = document.getElementById("fsToggleComments");
const fsCommentSidebar = document.getElementById("fsCommentSidebar");
const fsCommentContent = document.getElementById("fsCommentContent");
const fsLockZoomBtn = document.getElementById("fsLockZoomBtn");
const fsPinPositionBtn = document.getElementById("fsPinPositionBtn");
const fsToggleReviewBtn = document.getElementById("fsToggleReviewBtn");

const reviewListEl = document.getElementById("reviewList");
const reviewCount = document.getElementById("reviewCount");
const toggleReviewBtn = document.getElementById("toggleReviewBtn");

const unmemorizedCountText = document.getElementById("unmemorizedCountText");
const unmemorizedTotalText = document.getElementById("unmemorizedTotalText");
const fsUnmemorizedCountText = document.getElementById("fsUnmemorizedCountText");
const fsUnmemorizedTotalText = document.getElementById("fsUnmemorizedTotalText");

const reviewLevelFilter = document.getElementById("reviewLevelFilter");
const reviewLevelControl = document.getElementById("reviewLevelControl");
const btnLevelDown = document.getElementById("btnLevelDown");
const btnLevelUp = document.getElementById("btnLevelUp");
const currentLevelInput = document.getElementById("currentLevelInput");

const fsReviewLevelControl = document.getElementById("fsReviewLevelControl");
const fsBtnLevelDown = document.getElementById("fsBtnLevelDown");
const fsBtnLevelUp = document.getElementById("fsBtnLevelUp");
const fsCurrentLevelInput = document.getElementById("fsCurrentLevelInput");


// Event listeners
openZipBtn.addEventListener("click", handleSelectZip);
dropZone.addEventListener("click", handleSelectZip); // Click to select works for drop zone too

// Drag and drop listeners
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", handleDrop);

prevQuestionBtn.addEventListener("click", () => navigateQuestion(-1));
nextQuestionBtn.addEventListener("click", () => navigateQuestion(1));
if (toggleReviewBtn) toggleReviewBtn.addEventListener("click", toggleReviewQuestion);
if (fsToggleReviewBtn) fsToggleReviewBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleReviewQuestion();
});

if (reviewLevelFilter) reviewLevelFilter.addEventListener("change", () => {
  currentFilteredIndex = -1; 
  renderReviewList();
});

function adjustReviewLevel(amount) {
  if (!currentData || !currentData[currentExamIndex]) return;
  const exam = currentData[currentExamIndex];
  const question = exam.questions[currentQuestionIndex];
  
  const existingIndex = reviewList.findIndex(item => item.examName === exam.name && item.questionNumber === question.number);
  if (existingIndex !== -1) {
    reviewList[existingIndex].level = Math.max(1, (reviewList[existingIndex].level || 1) + amount);
    saveReviewList();
    renderReviewList();
    updateToggleReviewButtons();
  }
}

function setReviewLevel(value) {
  const val = parseInt(value);
  if (isNaN(val) || val < 1) return;
  if (!currentData || !currentData[currentExamIndex]) return;
  const exam = currentData[currentExamIndex];
  const question = exam.questions[currentQuestionIndex];
  
  const existingIndex = reviewList.findIndex(item => item.examName === exam.name && item.questionNumber === question.number);
  if (existingIndex !== -1) {
    reviewList[existingIndex].level = val;
    saveReviewList();
    renderReviewList();
    updateToggleReviewButtons();
  }
}

if (btnLevelDown) btnLevelDown.addEventListener("click", () => adjustReviewLevel(-1));
if (btnLevelUp) btnLevelUp.addEventListener("click", () => adjustReviewLevel(1));
if (currentLevelInput) currentLevelInput.addEventListener("change", (e) => setReviewLevel(e.target.value));

if (fsBtnLevelDown) fsBtnLevelDown.addEventListener("click", () => adjustReviewLevel(-1));
if (fsBtnLevelUp) fsBtnLevelUp.addEventListener("click", () => adjustReviewLevel(1));
if (fsCurrentLevelInput) fsCurrentLevelInput.addEventListener("change", (e) => setReviewLevel(e.target.value));

// Fullscreen image listeners
questionImage.addEventListener("click", openFullscreen);
fullscreenClose.addEventListener("click", closeFullscreen);

fsPrevBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  navigateQuestion(-1);
});

fsNextBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  navigateQuestion(1);
});

// Zoom and Pan listeners
fullscreenImage.addEventListener("wheel", handleZoom);
fullscreenImage.addEventListener("mousedown", handleDragStart);
fullscreenImage.addEventListener("dblclick", handleDoubleClick);
document.addEventListener("mousemove", handleDragMove);
document.addEventListener("mouseup", handleDragEnd);

fsToggleComments.addEventListener("click", (e) => {
  e.stopPropagation();
  fsCommentSidebar.classList.toggle("visible");
});

if (fsLockZoomBtn) {
  fsLockZoomBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isZoomLocked = !isZoomLocked;
    fsLockZoomBtn.classList.toggle("active", isZoomLocked);
  });
}

if (fsPinPositionBtn) {
  fsPinPositionBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isPositionPinned = !isPositionPinned;
    fsPinPositionBtn.classList.toggle("active", isPositionPinned);
  });
}



// Keyboard navigation
document.addEventListener("keydown", (e) => {
  // Close fullscreen with ESC
  if (e.key === "Escape" && fullscreenModal.classList.contains("active")) {
    closeFullscreen();
    return;
  }

  if (!currentData) return;

  // Navigate questions with Left/Right arrows
  if (e.key === "ArrowLeft") {
    navigateQuestion(-1);
  } else if (e.key === "ArrowRight") {
    navigateQuestion(1);
  }
  // Navigate exams with Up/Down arrows
  else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (currentExamIndex > 0) {
      showExam(currentExamIndex - 1);
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (currentExamIndex < currentData.length - 1) {
      showExam(currentExamIndex + 1);
    }
  }
  // Toggle comment sidebar in fullscreen with V
  if (e.key.toLowerCase() === 'v' && fullscreenModal.classList.contains('active')) {
    e.preventDefault();
    fsCommentSidebar.classList.toggle('visible');
    return;
  }
});

async function handleSelectZip() {
  try {
    const zipPath = await window.electronAPI.selectZipFile();
    if (zipPath) {
      await loadZip(zipPath);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

// Comment submission
document.querySelectorAll(".comment-submit-btn").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    if (!currentData || !currentZipPath) return;
    
    // Find the associated textarea in the same container
    const container = e.target.closest(".comment-input-area");
    const textarea = container.querySelector(".comment-input-textarea");
    const text = textarea.value.trim();
    
    if (!text) return;
    
    // Disable button while saving
    e.target.disabled = true;
    e.target.textContent = "Saving...";
    
    const exam = currentData[currentExamIndex];
    const question = exam.questions[currentQuestionIndex];
    
    // Format the new comment block
    const now = new Date();
    // Use a large number or generate an ID to avoid conflicts, or just use timestamp
    const timestamp = now.getTime();
    
    // The format that parseStructuredComment expects
    const newCommentStr = `#9999 | User: admin | Date: ${now.toLocaleString()}\nID: admin_${timestamp}\nContent:\n${text}\n---`;
    
    try {
      const res = await window.electronAPI.saveComment({
        zipPath: currentZipPath,
        examFolder: exam.name,
        questionNumber: question.number,
        commentText: newCommentStr
      });
      
      if (res.success) {
        // Update in-memory state
        if (question.comment && question.comment.trim()) {
           question.comment += `\n${newCommentStr}`;
        } else {
           question.comment = `Media ID: 0\nSource: local\nExtracted At: ${now.toLocaleString()}\nTotal Comments: 1\n====\n${newCommentStr}`;
        }
        
        // Re-render the comments
        const commentHtml = parseComment(question.comment);
        commentContent.innerHTML = commentHtml;
        fsCommentContent.innerHTML = commentHtml;
        
        // Clear inputs
        document.querySelectorAll(".comment-input-textarea").forEach(ta => ta.value = "");
      } else {
        alert("Failed to save comment: " + res.error);
      }
    } catch (err) {
      alert("Error saving comment: " + err.message);
    } finally {
      e.target.disabled = false;
      e.target.textContent = "Send";
    }
  });
});

async function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("drag-over");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    // In Electron renderer, File object has a 'path' property
    if (file.path && file.path.toLowerCase().endsWith(".zip")) {
      await loadZip(file.path);
    } else {
      alert("Please drop a valid .zip file.");
    }
  }
}

async function loadZip(zipPath) {
  try {
    const result = await window.electronAPI.loadZipFile(zipPath);

    if (!result.success) {
      alert(`Error loading ZIP file: ${result.error}`);
      return;
    }

    if (!result.exams || result.exams.length === 0) {
      alert("No valid exam data found in the ZIP file");
      return;
    }

    currentData = result.exams;
    currentZipPath = zipPath;
    currentExamIndex = 0;
    currentQuestionIndex = 0;

    // Load completed exams from localStorage
    loadCompletedExams();
    loadReviewList();

    // Hide welcome screen and show viewer immediately
    welcomeScreen.classList.add("hidden");
    viewerContent.classList.remove("hidden");

    renderExamList();
    renderReviewList();
    showExam(0);
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

function renderExamList() {
  examCount.textContent = currentData.length;

  // Group exams by year and season
  const groupedExams = groupExamsByYearAndSeason(currentData);

  // Render grouped exams
  let html = "";
  groupedExams.forEach((group) => {
    html += `<div class="exam-season-group">`;
    html += `<div class="exam-season-header">${group.seasonYear}</div>`;

    group.exams.forEach(({ exam, originalIndex }) => {
      const examId = exam.name;
      html += `
        <div class="exam-item ${originalIndex === currentExamIndex ? "active" : ""} ${completedExams.has(examId) ? "completed" : ""}" data-index="${originalIndex}" data-exam-id="${encodeURIComponent(examId)}">
          <div class="exam-item-header">
            <input type="checkbox" class="exam-item-checkbox" ${completedExams.has(examId) ? "checked" : ""}>
            <div class="exam-item-name">${exam.name}</div>
          </div>
          <div class="exam-item-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>${exam.questions.length} questions</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  examList.innerHTML = html;

  // Add click handlers
  document.querySelectorAll(".exam-item").forEach((item) => {
    // Main item click - show exam
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("exam-item-checkbox")) {
        return; // Let checkbox handler take priority
      }
      const index = parseInt(item.dataset.index);
      showExam(index);
    });

    // Checkbox toggle
    const checkbox = item.querySelector(".exam-item-checkbox");
    if (checkbox) {
      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      checkbox.addEventListener("change", (e) => {
        const examId = decodeURIComponent(item.dataset.examId);
        if (e.target.checked) {
          completedExams.add(examId);
        } else {
          completedExams.delete(examId);
        }
        saveCompletedExams();
        item.classList.toggle("completed");
      });
    }
  });
}

function showExam(examIndex) {
  if (!currentData || examIndex < 0 || examIndex >= currentData.length) {
    return;
  }

  currentExamIndex = examIndex;
  currentQuestionIndex = 0;

  const exam = currentData[examIndex];

  // Update exam info
  currentExamName.textContent = exam.name;
  questionCount.textContent = `${exam.questions.length} question${exam.questions.length !== 1 ? "s" : ""}`;

  // Render attachments
  examAttachments.innerHTML = "";
  if (exam.attachments && exam.attachments.length > 0) {
    exam.attachments.forEach((att) => {
      const el = document.createElement("div");
      el.className = "attachment-item";
      el.title = `Download ${att.name} (${formatBytes(att.size)})`;
      el.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <span>${att.name}</span>
      `;
      el.addEventListener("click", () => saveExamAttachment(att.path));
      examAttachments.appendChild(el);
    });
  }

  // Update active state in sidebar using original data index.
  // Sidebar items are grouped by season/year so DOM order may not match examIndex.
  document.querySelectorAll(".exam-item").forEach((item) => {
    const itemIndex = parseInt(item.dataset.index, 10);
    if (itemIndex === examIndex) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
  
  isReviewMode = false;
  currentReviewIndex = -1;
  renderReviewList(); // clear active state in review list
  
  // Show first question
  showQuestion(0);
}

function showQuestion(questionIndex) {
  const exam = currentData[currentExamIndex];

  if (!exam || questionIndex < 0 || questionIndex >= exam.questions.length) {
    return;
  }

  currentQuestionIndex = questionIndex;
  const question = exam.questions[questionIndex];

  // Update question indicator
  if (isReviewMode) {
    const filteredList = getFilteredReviewList();
    questionIndicator.textContent = `${currentFilteredIndex + 1} / ${filteredList.length}`;
    const isSingleReview = filteredList.length <= 1;
    prevQuestionBtn.disabled = isSingleReview;
    nextQuestionBtn.disabled = isSingleReview;
    
    if (fullscreenModal.classList.contains("active")) {
      fsPrevBtn.disabled = isSingleReview;
      fsNextBtn.disabled = isSingleReview;
      fsQuestionIndicator.textContent = `${currentFilteredIndex + 1} / ${filteredList.length}`;
    }
  } else {
    questionIndicator.textContent = `${questionIndex + 1} / ${exam.questions.length}`;
    const isSingleQuestion = exam.questions.length <= 1;
    prevQuestionBtn.disabled = isSingleQuestion;
    nextQuestionBtn.disabled = isSingleQuestion;

    if (fullscreenModal.classList.contains("active")) {
      fsPrevBtn.disabled = isSingleQuestion;
      fsNextBtn.disabled = isSingleQuestion;
      fsQuestionIndicator.textContent = `${questionIndex + 1} / ${exam.questions.length}`;
    }
  }

  // Update question image
  if (question.image) {
    questionImage.src = question.image;
    questionImage.alt = `Question ${question.number}`;
    questionImage.style.cursor = "pointer";
    questionImage.title = "Click to view fullscreen";

    // Update fullscreen image if open
    if (fullscreenModal.classList.contains("active")) {
      fullscreenImage.src = question.image;
    }
  } else {
    questionImage.src = "";
    questionImage.alt = "No image available";
    questionImage.style.cursor = "default";

    if (fullscreenModal.classList.contains("active")) {
      fullscreenImage.src = "";
    }
  }

  // Reset zoom when showing new question if in fullscreen (or preemptively)
  if (fullscreenModal.classList.contains("active")) {
    if (!isZoomLocked) zoomLevel = 1;
    if (!isPositionPinned) {
      currentTranslateX = 0;
      currentTranslateY = 0;
    }
    isDragging = false;
    updateImageTransform();
    fullscreenImage.style.cursor = "grab";
  }

  // Update comment with formatted display
  let commentHtml =
    '<p class="no-comment">No comment available for this question</p>';

  if (question.comment && question.comment.trim()) {
    commentHtml = parseComment(question.comment);
  }

  commentContent.innerHTML = commentHtml;

  // Update fullscreen comment if open
  if (fullscreenModal.classList.contains("active")) {
    fsCommentContent.innerHTML = commentHtml;
  }

  updateToggleReviewButtons();
}



function parseComment(commentText) {
  // Check if it's a structured comment from fuoverflow.com
  if (commentText.includes("Media ID:") && commentText.includes("Source:")) {
    return parseStructuredComment(commentText);
  }

  // Otherwise, display as plain text
  return `<pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(commentText)}</pre>`;
}

function parseStructuredComment(text) {
  const lines = text.split("\n");
  let html = "";

  // Parse metadata (first few lines)
  let metadataHtml = '<div class="comment-metadata">';
  let i = 0;

  while (i < lines.length && !lines[i].includes("====")) {
    const line = lines[i].trim();

    if (line.startsWith("Media ID:")) {
      metadataHtml += `<div class="comment-metadata-item">
        <span class="comment-metadata-label">Media ID:</span>
        <span class="comment-metadata-value">${escapeHtml(line.replace("Media ID:", "").trim())}</span>
      </div>`;
    } else if (line.startsWith("Source:")) {
      const url = line.replace("Source:", "").trim();
      metadataHtml += `<div class="comment-metadata-item">
        <span class="comment-metadata-label">Source:</span>
        <span class="comment-metadata-value"><a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a></span>
      </div>`;
    } else if (line.startsWith("Extracted At:")) {
      metadataHtml += `<div class="comment-metadata-item">
        <span class="comment-metadata-label">Extracted At:</span>
        <span class="comment-metadata-value">${escapeHtml(line.replace("Extracted At:", "").trim())}</span>
      </div>`;
    } else if (line.startsWith("Total Comments:")) {
      metadataHtml += `<div class="comment-metadata-item">
        <span class="comment-metadata-label">Total Comments:</span>
        <span class="comment-metadata-value">${escapeHtml(line.replace("Total Comments:", "").trim())}</span>
      </div>`;
    }

    i++;
  }

  metadataHtml += "</div>";
  html += metadataHtml;

  // Skip the separator line
  if (i < lines.length && lines[i].includes("====")) {
    i++;
  }

  // Parse individual comments
  let currentComment = null;
  const commentsList = [];

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith("#") && line.includes("|")) {
      // Save previous comment if exists
      if (currentComment) {
        commentsList.push(currentComment);
      }

      // Start new comment
      const parts = line.split("|").map((p) => p.trim());
      const number = parts[0].replace("#", "").trim();
      const userPart = parts.find((p) => p.startsWith("User:"));
      const datePart = parts.find((p) => p.startsWith("Date:"));

      currentComment = {
        number: number,
        user: userPart ? userPart.replace("User:", "").trim() : "Unknown",
        date: datePart ? datePart.replace("Date:", "").trim() : "",
        id: "",
        content: "",
      };
    } else if (line.startsWith("ID:") && currentComment) {
      currentComment.id = line.replace("ID:", "").trim();
    } else if (line.startsWith("Content:") && currentComment) {
      // Start collecting content
      i++;
      let contentLines = [];
      while (i < lines.length && !lines[i].includes("---")) {
        if (lines[i].trim()) {
          contentLines.push(lines[i].trim());
        }
        i++;
      }
      currentComment.content = contentLines.join(" ");
      i--; // Back up one line
    }

    i++;
  }

  // Add last comment
  if (currentComment) {
    commentsList.push(currentComment);
  }
  
  // Sort comments so that 'admin' is at the top
  commentsList.sort((a, b) => {
    const isAAdmin = a.user.toLowerCase() === 'admin';
    const isBAdmin = b.user.toLowerCase() === 'admin';
    if (isAAdmin && !isBAdmin) return -1;
    if (!isAAdmin && isBAdmin) return 1;
    // Otherwise keep original order by assuming lower numbers came first (or keep stable)
    return 0; 
  });
  
  for (const comment of commentsList) {
    html += formatCommentItem(comment);
  }

  return html;
}

function formatCommentItem(comment) {
  const isAdmin = comment.user.toLowerCase() === 'admin';
  const adminClass = isAdmin ? ' admin-comment' : '';
  
  return `
    <div class="comment-item${adminClass}">
      <div class="comment-item-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="comment-item-number">#${escapeHtml(comment.number)}</span>
          <span class="comment-item-user">${escapeHtml(comment.user)}</span>
        </div>
        <span class="comment-item-date">${escapeHtml(comment.date)}</span>
      </div>
      <div class="comment-item-content">${escapeHtml(comment.content)}</div>
    </div>
  `;
}

function openFullscreen() {
  if (questionImage.src && questionImage.src !== "") {
    fullscreenImage.src = questionImage.src;
    fsCommentContent.innerHTML = commentContent.innerHTML;
    fullscreenModal.classList.add("active");

    // Ensure sidebar is visible by default
    fsCommentSidebar.classList.add("visible");

    // Reset zoom state on open
    if (!isZoomLocked) zoomLevel = 1;
    if (!isPositionPinned) {
      currentTranslateX = 0;
      currentTranslateY = 0;
    }
    isDragging = false;
    updateImageTransform();
    fullscreenImage.style.cursor = "grab";

    // Update button states and indicator
    if (isReviewMode) {
      const isSingleReview = reviewList.length <= 1;
      fsPrevBtn.disabled = isSingleReview;
      fsNextBtn.disabled = isSingleReview;
      fsQuestionIndicator.textContent = `${currentReviewIndex + 1} / ${reviewList.length}`;
    } else {
      const exam = currentData[currentExamIndex];
      const isSingleQuestion = exam.questions.length <= 1;
      fsPrevBtn.disabled = isSingleQuestion;
      fsNextBtn.disabled = isSingleQuestion;
      fsQuestionIndicator.textContent = `${currentQuestionIndex + 1} / ${exam.questions.length}`;
    }
  }
}

function closeFullscreen() {
  fullscreenModal.classList.remove("active");
}

function navigateQuestion(direction) {
  if (isReviewMode) {
    const filteredList = getFilteredReviewList();
    if (filteredList.length === 0) {
      isReviewMode = false;
      return;
    }
    
    let inFilteredList = false;
    if (currentData && currentData[currentExamIndex]) {
      const exam = currentData[currentExamIndex];
      const question = exam.questions[currentQuestionIndex];
      inFilteredList = filteredList.some(item => item.examName === exam.name && item.questionNumber === question.number);
    }
    
    let newFilteredIndex = currentFilteredIndex;
    if (inFilteredList) {
      newFilteredIndex += direction;
    } else {
      if (direction < 0) {
        newFilteredIndex -= 1;
      }
    }
    
    if (newFilteredIndex < 0) {
      newFilteredIndex = filteredList.length - 1;
    } else if (newFilteredIndex >= filteredList.length) {
      newFilteredIndex = 0;
    }
    
    const nextItem = filteredList[newFilteredIndex];
    const originalIndex = reviewList.indexOf(nextItem);
    showReviewQuestion(originalIndex, newFilteredIndex);
  } else {
    const exam = currentData[currentExamIndex];
    let newIndex = currentQuestionIndex + direction;

    // Handle looping
    if (newIndex < 0) {
      newIndex = exam.questions.length - 1;
    } else if (newIndex >= exam.questions.length) {
      newIndex = 0;
    }

    showQuestion(newIndex);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Zoom and Pan handlers
function handleZoom(e) {
  if (!fullscreenModal.classList.contains("active")) return;
  e.preventDefault();

  // Zoom speed
  const delta = e.deltaY * -0.002;
  const newZoom = Math.min(Math.max(1, zoomLevel + delta), 5); // Min 1x, Max 5x

  // If zooming out to 1, reset translate
  if (newZoom === 1) {
    currentTranslateX = 0;
    currentTranslateY = 0;
  }

  zoomLevel = newZoom;
  updateImageTransform();
}

function handleDragStart(e) {
  if (zoomLevel <= 1) return; // Only drag if zoomed
  e.preventDefault();
  isDragging = true;
  startDragX = e.clientX - currentTranslateX;
  startDragY = e.clientY - currentTranslateY;
  fullscreenImage.style.cursor = "grabbing";
}

function handleDragMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  currentTranslateX = e.clientX - startDragX;
  currentTranslateY = e.clientY - startDragY;
  updateImageTransform();
}

function handleDragEnd() {
  isDragging = false;
  fullscreenImage.style.cursor = "grab";
}

function handleDoubleClick(e) {
  if (zoomLevel > 1) {
    resetZoom();
  } else {
    // Zoom into point logic
    const container = fullscreenImage.parentElement;
    const rect = container.getBoundingClientRect();

    // Mouse position relative to center (0,0) of the viewport
    // This works because the image is centered by default and transform-origin is center
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const newZoom = 2.5; // Set zoom level (e.g., 2.5x)

    // Calculate new translation to keep the clicked point stationary
    // Formula derived from: (Point - T_old)/S_old * S_new + T_new = Point
    // Since starting from S=1, T=0: T_new = Point - Point * S_new = -Point * (S_new - 1)
    currentTranslateX = -mouseX * (newZoom - 1);
    currentTranslateY = -mouseY * (newZoom - 1);

    zoomLevel = newZoom;
    updateImageTransform();
    fullscreenImage.style.cursor = "grab";
  }
}

function resetZoom() {
  zoomLevel = 1;
  currentTranslateX = 0;
  currentTranslateY = 0;
  isDragging = false;
  updateImageTransform();
  fullscreenImage.style.cursor = "grab";
}

function updateImageTransform() {
  const container = fullscreenImage.parentElement;

  // Calculate displayed dimensions
  const imageWidth = fullscreenImage.offsetWidth * zoomLevel;
  const imageHeight = fullscreenImage.offsetHeight * zoomLevel;

  // Calculate container dimensions (viewport)
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // Calculate boundaries
  // If image is larger than container, we can pan (w - cw) / 2 in either direction
  // If image is smaller, limit is 0 (keep centered)
  const limitX = Math.max(0, (imageWidth - containerWidth) / 2);
  const limitY = Math.max(0, (imageHeight - containerHeight) / 2);

  // Clamp translate values
  currentTranslateX = Math.min(limitX, Math.max(-limitX, currentTranslateX));
  currentTranslateY = Math.min(limitY, Math.max(-limitY, currentTranslateY));

  fullscreenImage.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${zoomLevel})`;
}

async function saveExamAttachment(entryPath) {
  if (!currentZipPath) return;

  try {
    const result = await window.electronAPI.saveAttachment(
      currentZipPath,
      entryPath,
    );
    if (!result.success && !result.canceled) {
      alert(`Failed to save attachment: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// --- Theme Toggle ---
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme") || "dark";

// Apply saved theme
if (savedTheme === "light") {
  document.body.classList.add("light-mode");
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const theme = document.body.classList.contains("light-mode")
      ? "light"
      : "dark";
    localStorage.setItem("theme", theme);
  });
}

// Auto Updater UI Handler
const updateNotification = document.getElementById("updateNotification");

// Listen for update messages (errors, status)
window.electronAPI.onUpdateMessage((text) => {
  if (text.startsWith("Error")) {
    // Show error in notification if possible, or alert
    if (updateNotification) {
      updateNotification.classList.remove("hidden");
      const span = updateNotification.querySelector("span");
      if (span) span.textContent = "Update Error!";
      if (restartBtn) {
        restartBtn.textContent = "Error";
        restartBtn.title = text;
      }
    }
  }
});

const restartBtn = document.getElementById("restartBtn");
let updateDownloaded = false;

if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    if (updateDownloaded) {
      window.electronAPI.restartApp();
    }
  });
}

// Listen for updates
window.electronAPI.onUpdateAvailable(() => {
  if (updateNotification) {
    updateNotification.classList.remove("hidden");
    // Update text to show downloading
    const span = updateNotification.querySelector("span");
    if (span) span.textContent = "Downloading update...";
    if (restartBtn) {
      restartBtn.disabled = true;
      restartBtn.textContent = "Downloading...";
    }
  }
});

window.electronAPI.onUpdateDownloadProgress((progressObj) => {
  if (updateNotification) {
    const span = updateNotification.querySelector("span");
    const percent = Math.round(progressObj.percent);
    if (span) span.textContent = `Downloading update... ${percent}%`;
    if (restartBtn) {
      restartBtn.textContent = `Downloading ${percent}%`;
    }
  }
});

window.electronAPI.onUpdateDownloaded(() => {
  updateDownloaded = true;
  if (updateNotification) {
    updateNotification.classList.remove("hidden");
    // Update text to show ready
    const span = updateNotification.querySelector("span");
    if (span) span.textContent = "New version ready!";
    if (restartBtn) {
      restartBtn.disabled = false;
      restartBtn.textContent = "Restart to Update";
    }
  }
});

// Check for updates on load
window.electronAPI.checkForUpdate();

// --- Exam Parsing and Grouping ---

function parseExamSeason(examName) {
  // Map of season abbreviations to full names and order
  const seasonMap = {
    SP: { name: "Spring", order: 1 },
    SU: { name: "Summer", order: 2 },
    FA: { name: "Fall", order: 3 },
    WI: { name: "Winter", order: 4 },
    SPRING: { name: "Spring", order: 1 },
    SUMMER: { name: "Summer", order: 2 },
    FALL: { name: "Fall", order: 3 },
    WINTER: { name: "Winter", order: 4 },
  };

  // Keyword-based approach: Search for any season keyword followed by a year
  // Examples: "SWD392_SU25_Final Exam" -> SU25 -> Summer 2025
  //           "PRU211m - FA 2023 - RE" -> FA 2023 -> Fall 2023

  // Build regex with all season keywords: (SP|SU|FA|WI|SPRING|SUMMER|FALL|WINTER)\s*[-–—_]?\s*(\d{2,4})
  const seasonKeywords = Object.keys(seasonMap).join("|");
  const pattern = new RegExp(
    `(${seasonKeywords})\\s*[-–—_]?\\s*(\\d{2,4})`,
    "i",
  );

  const match = examName.match(pattern);
  if (match) {
    const seasonCode = match[1].toUpperCase();
    let year = match[2];

    // Make sure this is a known season
    if (seasonMap[seasonCode]) {
      // Normalize 2-digit year to 4-digit
      if (year.length === 2) {
        const yearNum = parseInt(year);
        year = (yearNum < 50 ? 2000 : 1900) + yearNum;
      } else {
        year = parseInt(year);
      }

      return {
        season: seasonMap[seasonCode].name,
        year: year,
        order: seasonMap[seasonCode].order,
      };
    }
  }

  // Fallback: return unknown
  return {
    season: "Other",
    year: 0,
    order: 999,
  };
}

function groupExamsByYearAndSeason(exams) {
  // Parse each exam and create groups
  const examsWithInfo = exams.map((exam, index) => ({
    exam,
    originalIndex: index,
    ...parseExamSeason(exam.name),
  }));

  // Group by year and season
  const groups = {};
  examsWithInfo.forEach((item) => {
    const key = `${item.year}-${item.order}`;
    if (!groups[key]) {
      groups[key] = {
        year: item.year,
        season: item.season,
        order: item.order,
        exams: [],
      };
    }
    groups[key].exams.push(item);
  });

  // Convert to array and sort by year (desc) then season order (asc)
  const sortedGroups = Object.values(groups).sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year; // Newest first
    }
    return a.order - b.order; // Spring → Summer → Fall → Winter
  });

  // Format season-year display
  return sortedGroups.map((group) => ({
    ...group,
    seasonYear: group.year > 0 ? `${group.season} ${group.year}` : "Other",
  }));
}

function hashString(str) {
  // Simple deterministic hash (djb2) for stable localStorage keys
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash >>> 0; // Force to uint32
  }
  return hash.toString(16);
}



function getCompletedExamsKey() {
  if (!currentZipPath) return null;
  const normalizedZipPath = currentZipPath.replace(/\\/g, "/");
  return `completedExams::zip::${hashString(normalizedZipPath)}`;
}

function loadCompletedExams() {
  try {
    const key = getCompletedExamsKey();
    completedExams = new Set();
    if (!key) return;

    const saved = localStorage.getItem(key);
    completedExams = new Set(saved ? JSON.parse(saved) : []);
  } catch (error) {
    console.error("Failed to load completed exams:", error);
    completedExams = new Set();
  }
}

function saveCompletedExams() {
  try {
    const key = getCompletedExamsKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(Array.from(completedExams)));
  } catch (error) {
    console.error("Failed to save completed exams:", error);
  }
}

// completedExams sẽ được load khi đã có ZIP (trong loadZip)

// --- Review List Logic ---
function getReviewListKey() {
  if (!currentZipPath) return null;
  const normalizedZipPath = currentZipPath.replace(/\\/g, "/");
  return `reviewList::zip::${hashString(normalizedZipPath)}`;
}

function loadReviewList() {
  try {
    const key = getReviewListKey();
    reviewList = [];
    if (!key) return;
    const saved = localStorage.getItem(key);
    if (saved) {
      reviewList = JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load review list:", error);
    reviewList = [];
  }
}

function saveReviewList() {
  try {
    const key = getReviewListKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(reviewList));
  } catch (error) {
    console.error("Failed to save review list:", error);
  }
}

function isCurrentQuestionInReviewList() {
  if (!currentData || !currentData[currentExamIndex]) return false;
  const exam = currentData[currentExamIndex];
  const question = exam.questions[currentQuestionIndex];
  return reviewList.some(item => item.examName === exam.name && item.questionNumber === question.number);
}

function toggleReviewQuestion() {
  if (!currentData || !currentData[currentExamIndex]) return;
  const exam = currentData[currentExamIndex];
  const question = exam.questions[currentQuestionIndex];
  
  const existingIndex = reviewList.findIndex(item => item.examName === exam.name && item.questionNumber === question.number);
  
  if (existingIndex !== -1) {
    reviewList.splice(existingIndex, 1);
  } else {
    reviewList.push({
      examName: exam.name,
      questionNumber: question.number,
      examIndex: currentExamIndex,
      questionIndex: currentQuestionIndex,
      level: 1
    });
  }
  
  saveReviewList();
  renderReviewList();
  updateToggleReviewButtons();
}

function getFilteredReviewList() {
  const filterVal = reviewLevelFilter ? reviewLevelFilter.value : "all";
  if (filterVal === "all") return reviewList;
  const lvl = parseInt(filterVal);
  return reviewList.filter(item => (item.level || 1) === lvl);
}

function updateToggleReviewButtons() {
  const inList = isCurrentQuestionInReviewList();
  if (toggleReviewBtn) toggleReviewBtn.classList.toggle("active", inList);
  if (fsToggleReviewBtn) fsToggleReviewBtn.classList.toggle("active", inList);
  
  if (inList) {
    const exam = currentData[currentExamIndex];
    const question = exam.questions[currentQuestionIndex];
    const existingIndex = reviewList.findIndex(item => item.examName === exam.name && item.questionNumber === question.number);
    if (existingIndex !== -1) {
      const level = reviewList[existingIndex].level || 1;
      if (currentLevelInput) currentLevelInput.value = level;
      if (fsCurrentLevelInput) fsCurrentLevelInput.value = level;
    }
    if (reviewLevelControl) reviewLevelControl.classList.remove("hidden");
    if (fsReviewLevelControl) fsReviewLevelControl.classList.remove("hidden");
  } else {
    if (reviewLevelControl) reviewLevelControl.classList.add("hidden");
    if (fsReviewLevelControl) fsReviewLevelControl.classList.add("hidden");
  }
  
  updateUnmemorizedStats();
}

function updateUnmemorizedStats() {
  if (!currentData || !currentData[currentExamIndex]) return;
  const exam = currentData[currentExamIndex];
  
  const count = reviewList.filter(item => item.examName === exam.name).length;
  const total = exam.questions.length;
  
  if (unmemorizedCountText) unmemorizedCountText.textContent = count;
  if (unmemorizedTotalText) unmemorizedTotalText.textContent = total;
  
  if (fsUnmemorizedCountText) fsUnmemorizedCountText.textContent = count;
  if (fsUnmemorizedTotalText) fsUnmemorizedTotalText.textContent = total;
}

function updateReviewFilterOptions() {
  if (!reviewLevelFilter) return;
  const currentVal = reviewLevelFilter.value;
  
  const levels = new Set(reviewList.map(item => item.level || 1));
  const sortedLevels = Array.from(levels).sort((a,b) => a - b);
  
  let html = `<option value="all">Tất cả</option>`;
  sortedLevels.forEach(lvl => {
    html += `<option value="${lvl}">Cấp ${lvl}</option>`;
  });
  reviewLevelFilter.innerHTML = html;
  
  if (currentVal === "all" || levels.has(parseInt(currentVal))) {
    reviewLevelFilter.value = currentVal;
  } else {
    reviewLevelFilter.value = "all";
    currentFilteredIndex = -1;
  }
}

function renderReviewList() {
  if (!reviewListEl) return;
  
  updateReviewFilterOptions();
  
  const filteredList = getFilteredReviewList();
  if (reviewCount) reviewCount.textContent = filteredList.length;
  
  if (filteredList.length === 0) {
    reviewListEl.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Trống</p>
      </div>
    `;
    return;
  }
  
  let html = "";
  filteredList.forEach((item, filteredIndex) => {
    const originalIndex = reviewList.indexOf(item);
    const isActive = isReviewMode && currentFilteredIndex === filteredIndex;
    const level = item.level || 1;
    html += `
      <div class="exam-item ${isActive ? "active" : ""}" data-review-index="${originalIndex}" data-filtered-index="${filteredIndex}">
        <div class="exam-item-header">
          <input type="checkbox" class="exam-item-checkbox review-item-checkbox" title="Xóa khỏi danh sách">
          <div class="exam-item-name" style="font-size: 0.85rem; display: flex; align-items: center;">
            <span style="background: var(--primary); color: white; padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.7rem; margin-right: 0.35rem; white-space: nowrap;">Lv.${level}</span>
            ${item.examName} - Q${item.questionNumber}
          </div>
        </div>
      </div>
    `;
  });
  
  reviewListEl.innerHTML = html;
  
  reviewListEl.querySelectorAll(".exam-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("review-item-checkbox")) return;
      const originalIndex = parseInt(item.dataset.reviewIndex);
      const filteredIndex = parseInt(item.dataset.filteredIndex);
      showReviewQuestion(originalIndex, filteredIndex);
    });
    
    const checkbox = item.querySelector(".review-item-checkbox");
    if (checkbox) {
      checkbox.addEventListener("click", (e) => e.stopPropagation());
      checkbox.addEventListener("change", (e) => {
        const originalIndex = parseInt(item.dataset.reviewIndex);
        reviewList.splice(originalIndex, 1);
        saveReviewList();
        renderReviewList();
        updateToggleReviewButtons();
      });
    }
  });
}

function showReviewQuestion(index, filteredIndex = -1) {
  if (index < 0 || index >= reviewList.length) return;
  
  isReviewMode = true;
  currentReviewIndex = index;
  
  const item = reviewList[index];
  
  const filteredList = getFilteredReviewList();
  if (filteredIndex !== -1) {
    currentFilteredIndex = filteredIndex;
  } else {
    currentFilteredIndex = filteredList.indexOf(item);
  }
  
  let eIdx = item.examIndex;
  let qIdx = item.questionIndex;
  
  if (!currentData[eIdx] || currentData[eIdx].name !== item.examName) {
    eIdx = currentData.findIndex(e => e.name === item.examName);
  }
  if (eIdx !== -1) {
    const exam = currentData[eIdx];
    if (!exam.questions[qIdx] || exam.questions[qIdx].number !== item.questionNumber) {
      qIdx = exam.questions.findIndex(q => q.number === item.questionNumber);
    }
  }
  
  if (eIdx !== -1 && qIdx !== -1) {
    currentExamIndex = eIdx;
    
    const exam = currentData[eIdx];
    currentExamName.textContent = exam.name + " (Ôn tập)";
    questionCount.textContent = `${exam.questions.length} question${exam.questions.length !== 1 ? "s" : ""}`;
    
    examAttachments.innerHTML = "";
    if (exam.attachments && exam.attachments.length > 0) {
      exam.attachments.forEach((att) => {
        const el = document.createElement("div");
        el.className = "attachment-item";
        el.title = `Download ${att.name} (${formatBytes(att.size)})`;
        el.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span>${att.name}</span>
        `;
        el.addEventListener("click", () => saveExamAttachment(att.path));
        examAttachments.appendChild(el);
      });
    }
    
    document.querySelectorAll("#examList .exam-item").forEach(el => el.classList.remove("active"));
    renderReviewList(); 
    
    showQuestion(qIdx);
  }
}

// Display App Version
(async () => {
  try {
    const version = await window.electronAPI.getAppVersion();
    const versionEl = document.getElementById("appVersion");
    if (versionEl) {
      versionEl.textContent = `v${version}`;
    }
  } catch (error) {
    console.error("Failed to get app version:", error);
  }
})();

// --- Drive Explorer Logic ---
const driveModal = document.getElementById("driveModal");
const openDriveBtn = document.getElementById("openDriveBtn");
const closeDriveBtn = document.getElementById("closeDriveBtn");
const driveList = document.getElementById("driveList");
const driveBreadcrumbs = document.getElementById("driveBreadcrumbs");
const driveLoader = document.getElementById("driveLoader");
const driveSearchInput = document.getElementById("driveSearchInput");

let currentDriveFolder = null;
let driveHistory = []; // Array of {id, name}
let currentDriveFiles = []; // Store current files to access by ID
let activeTab = "browse"; // 'browse' or 'downloaded'

const driveBrowseTab = document.getElementById("driveBrowseTab");
const driveDownloadedTab = document.getElementById("driveDownloadedTab");

if (openDriveBtn) {
  openDriveBtn.addEventListener("click", () => {
    driveModal.classList.add("active");
    driveModal.classList.remove("hidden"); // Safety measure
    if (!currentDriveFolder) {
      loadDriveFolder("1poGRYG23zTRnEXQhsaY1fKXy1Au-rb7D", "Source FPT");
    }
  });
}

if (closeDriveBtn) {
  closeDriveBtn.addEventListener("click", () => {
    driveModal.classList.remove("active");
  });
}

// Tab switching
if (driveBrowseTab) {
  driveBrowseTab.addEventListener("click", () => {
    switchTab("browse");
  });
}

if (driveDownloadedTab) {
  driveDownloadedTab.addEventListener("click", () => {
    switchTab("downloaded");
  });
}

function switchTab(tab) {
  activeTab = tab;
  const openFolderBtn = document.getElementById("openExamFolderBtn");

  // Update tab styles
  if (driveBrowseTab && driveDownloadedTab) {
    if (tab === "browse") {
      driveBrowseTab.classList.add("active");
      driveDownloadedTab.classList.remove("active");

      // Hide folder button
      if (openFolderBtn) openFolderBtn.classList.add("hidden");

      // Show breadcrumbs and search for browse
      if (driveBreadcrumbs) driveBreadcrumbs.style.display = "flex";
      if (driveSearchInput)
        driveSearchInput.parentElement.style.display = "flex";

      // Reload browse content
      if (!currentDriveFolder) {
        loadDriveFolder("1poGRYG23zTRnEXQhsaY1fKXy1Au-rb7D", "Source FPT");
      } else {
        renderDriveFiles(currentDriveFiles);
      }
    } else {
      driveDownloadedTab.classList.add("active");
      driveBrowseTab.classList.remove("active");

      // Show folder button
      if (openFolderBtn) openFolderBtn.classList.remove("hidden");

      // Hide breadcrumbs and search for downloaded
      if (driveBreadcrumbs) driveBreadcrumbs.style.display = "none";
      if (driveSearchInput)
        driveSearchInput.parentElement.style.display = "none";

      // Load downloaded exams
      loadDownloadedExams();
    }
  }
}

async function loadDownloadedExams() {
  try {
    const exams = await window.electronAPI.getDownloadedExams();

    if (exams.length === 0) {
      driveList.innerHTML =
        '<p class="no-comment" style="grid-column: 1/-1;">No downloaded exams yet.<br><br>Download exams from the "Browse Exam" tab.</p>';
      return;
    }

    // Render as files
    renderDriveFiles(
      exams.map((exam) => ({
        id: null,
        name: exam.name,
        mimeType: "application/zip",
        size: exam.size,
        path: exam.path,
        isLocal: true,
      })),
    );
  } catch (error) {
    console.error("Failed to load downloaded exams:", error);
    driveList.innerHTML =
      '<p class="no-comment" style="grid-column: 1/-1;">Error loading downloaded exams.</p>';
  }
}

// Search functionality - only on button click or Enter
const driveSearchBtn = document.getElementById("driveSearchBtn");

const performSearch = () => {
  if (driveSearchInput) {
    const query = driveSearchInput.value.toLowerCase().trim();
    filterDriveFiles(query);
  }
};

if (driveSearchBtn) {
  driveSearchBtn.addEventListener("click", performSearch);
}

if (driveSearchInput) {
  // Trigger search on Enter key
  driveSearchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
}

// Open exam folder button
const openExamFolderBtn = document.getElementById("openExamFolderBtn");
if (openExamFolderBtn) {
  openExamFolderBtn.addEventListener("click", () => {
    window.electronAPI.openExamFolder();
  });
}

async function loadDriveFolder(folderId, folderName) {
  try {
    showDriveLoader(true);

    const existingIndex = driveHistory.findIndex((h) => h.id === folderId);
    if (existingIndex !== -1) {
      driveHistory = driveHistory.slice(0, existingIndex + 1);
    } else {
      driveHistory.push({ id: folderId, name: folderName });
    }

    updateBreadcrumbs();

    const files = await window.electronAPI.driveListFiles(folderId);
    currentDriveFiles = files;

    // Clear search when changing folders
    if (driveSearchInput) {
      driveSearchInput.value = "";
    }

    renderDriveFiles(files);

    currentDriveFolder = folderId;
  } catch (error) {
    alert("Failed to load Drive files: " + error);
  } finally {
    showDriveLoader(false);
  }
}

function filterDriveFiles(query) {
  if (!query) {
    // Show all files if search is empty
    if (currentDriveFiles) {
      renderDriveFiles(currentDriveFiles);
    }
    return;
  }

  // Check if we're at root folder
  const isRootFolder =
    currentDriveFolder === "1poGRYG23zTRnEXQhsaY1fKXy1Au-rb7D";

  if (isRootFolder) {
    // Global search from root - search all subfolders
    performGlobalSearch(query);
  } else {
    // Local search - filter current folder only
    if (!currentDriveFiles) return;
    const filtered = currentDriveFiles.filter((file) => {
      return file.name && file.name.toLowerCase().includes(query);
    });
    renderDriveFiles(filtered);
  }
}

async function performGlobalSearch(query) {
  try {
    // Show loading state
    if (driveSearchInput) {
      driveSearchInput.disabled = true;
    }
    if (driveSearchBtn) {
      driveSearchBtn.disabled = true;
      driveSearchBtn.classList.add("loading");
    }

    const results = await window.electronAPI.driveSearchFiles(
      "1poGRYG23zTRnEXQhsaY1fKXy1Au-rb7D",
      query,
    );
    renderDriveFiles(results);
  } catch (error) {
    alert("Search failed: " + error);
    renderDriveFiles([]);
  } finally {
    // Remove loading state
    if (driveSearchInput) {
      driveSearchInput.disabled = false;
    }
    if (driveSearchBtn) {
      driveSearchBtn.disabled = false;
      driveSearchBtn.classList.remove("loading");
    }
  }
}

function updateBreadcrumbs() {
  driveBreadcrumbs.innerHTML = "";
  driveHistory.forEach((item, index) => {
    const isLast = index === driveHistory.length - 1;
    const span = document.createElement("span");
    span.className = `breadcrumb-item ${isLast ? "active" : ""}`;
    span.textContent = item.name;

    if (!isLast) {
      span.onclick = () => loadDriveFolder(item.id, item.name);

      const sep = document.createElement("span");
      sep.className = "breadcrumb-separator";
      sep.textContent = "/";

      driveBreadcrumbs.appendChild(span);
      driveBreadcrumbs.appendChild(sep);
    } else {
      driveBreadcrumbs.appendChild(span);
    }
  });
}

function renderDriveFiles(files) {
  driveList.innerHTML = "";
  // console.log('Rendering drive files:', files ? files.length : 0);

  if (!files || files.length === 0) {
    driveList.innerHTML =
      '<p class="no-comment" style="grid-column: 1/-1;">No files found in this folder.</p>';
    return;
  }

  // Define icons once for performance
  const folderIcon =
    '<svg class="drive-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>';
  const zipIcon =
    '<svg class="drive-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
  const fileIcon =
    '<svg class="drive-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';

  files.forEach((file) => {
    try {
      if (!file) return;

      const name = file.name || "Untitled";
      const mimeType = file.mimeType || "";

      const isFolder = mimeType === "application/vnd.google-apps.folder";
      const isZip =
        mimeType.includes("zip") || name.toLowerCase().endsWith(".zip");
      const isLocal = file.isLocal || false;

      const div = document.createElement("div");
      div.className = `drive-item ${isFolder ? "folder" : isZip ? "zip" : ""}`;
      div.title = name;

      // Use string concatenation for innerHTML - it's faster and less error prone for mixed content
      let icon = fileIcon;
      if (isFolder) icon = folderIcon;
      else if (isZip) icon = zipIcon;

      // Safe HTML construction
      let html = icon;
      html += `<div class="drive-name"></div>`; // content filled via textContent below
      if (file.size) {
        html += `<div class="drive-size">${formatBytes(file.size)}</div>`;
      }

      // Add delete button for local files
      if (isLocal && file.path) {
        html += `<button class="drive-action-btn drive-delete-btn" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>`;
      }

      div.innerHTML = html;

      // Safely set text content
      const nameEl = div.querySelector(".drive-name");
      if (nameEl) nameEl.textContent = name;

      // Add click handler for the item
      div.onclick = (e) => {
        // Don't trigger if clicking action buttons
        if (!e.target.closest(".drive-action-btn")) {
          handleDriveItemClick(file);
        }
      };

      // Add click handler for delete button
      if (isLocal && file.path) {
        const deleteBtn = div.querySelector(".drive-delete-btn");
        if (deleteBtn) {
          deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
              const result = await window.electronAPI.deleteExam(file.path);
              if (result.success) {
                // Reload the downloaded exams list
                loadDownloadedExams();
              } else {
                alert(
                  "Failed to delete file: " + (result.error || "Unknown error"),
                );
              }
            }
          };
        }
      }

      driveList.appendChild(div);
    } catch (e) {
      console.error("Error rendering file item:", e);
    }
  });
}

async function handleDriveItemClick(file) {
  // If it's a local file (from Downloaded tab)
  if (file.isLocal && file.path) {
    driveModal.classList.remove("active");
    loadZip(file.path);
    return;
  }

  // Regular Drive file handling
  if (file.mimeType === "application/vnd.google-apps.folder") {
    loadDriveFolder(file.id, file.name);
  } else if (file.mimeType.includes("zip") || file.name.endsWith(".zip")) {
    if (confirm(`Do you want to download and open "${file.name}"?`)) {
      try {
        showDownloadProgress(true, file.name);
        const savedPath = await window.electronAPI.driveDownloadFile(
          file.id,
          file.name,
        );
        hideDownloadProgress();
        driveModal.classList.remove("active");
        loadZip(savedPath);
      } catch (error) {
        hideDownloadProgress();
        alert("Download failed: " + error);
      }
    }
  }
}

function showDownloadProgress(show, fileName = "") {
  const progressContainer = document.getElementById("driveDownloadProgress");
  const progressText = document.getElementById("downloadProgressText");

  if (show && progressContainer) {
    progressContainer.classList.remove("hidden");
    if (progressText && fileName) {
      progressText.textContent = `Downloading ${fileName}...`;
    }
  }
}

function hideDownloadProgress() {
  const progressContainer = document.getElementById("driveDownloadProgress");
  if (progressContainer) {
    progressContainer.classList.add("hidden");
  }
}

function updateDownloadProgress(data) {
  const progressBar = document.getElementById("downloadProgressBar");
  const progressDetails = document.getElementById("downloadProgressDetails");

  if (progressBar) {
    progressBar.style.width = `${data.progress}%`;
  }

  if (progressDetails) {
    const downloadedMB = (data.downloadedSize / (1024 * 1024)).toFixed(2);
    const totalMB = (data.totalSize / (1024 * 1024)).toFixed(2);
    progressDetails.textContent = `${downloadedMB} MB / ${totalMB} MB (${data.progress}%)`;
  }
}

// Listen for download progress
window.electronAPI.onDriveDownloadProgress(updateDownloadProgress);

function showDriveLoader(show) {
  if (show) {
    driveLoader.classList.remove("hidden");
  } else {
    driveLoader.classList.add("hidden");
  }
}
