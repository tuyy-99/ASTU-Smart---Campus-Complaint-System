const CATEGORY_KEYWORDS = {
  academic: [
    'academic', 'course', 'courses', 'class', 'classes', 'lecture', 'lecturer',
    'instructor', 'teacher', 'exam', 'quiz', 'grade', 'assignment', 'lab',
    'curriculum', 'registration', 'registrar'
  ],
  infrastructure: [
    'infrastructure', 'building', 'classroom', 'facility', 'facilities', 'electricity',
    'power', 'water', 'pipe', 'maintenance', 'repair', 'broken', 'gate', 'road',
    'internet', 'wifi', 'network'
  ],
  hostel: [
    'hostel', 'dorm', 'dormitory', 'room', 'roommate', 'bed', 'bathroom', 'toilet',
    'shower', 'residence', 'housing'
  ],
  library: [
    'library', 'book', 'books', 'librarian', 'reading', 'reference', 'borrowing',
    'borrow', 'catalog'
  ],
  cafeteria: [
    'cafeteria', 'canteen', 'food', 'meal', 'breakfast', 'lunch', 'dinner',
    'kitchen', 'hygiene', 'menu'
  ],
  transport: [
    'transport', 'bus', 'shuttle', 'driver', 'route', 'station', 'pickup',
    'drop', 'parking'
  ]
};

const CATEGORY_TO_DEPARTMENT = {
  academic: 'Academic Affairs',
  infrastructure: 'Infrastructure & Maintenance',
  hostel: 'Hostel Services',
  library: 'Library Services',
  cafeteria: 'Cafeteria Services',
  transport: 'Transport Services',
  other: 'Student Affairs'
};

const SUPPORTED_CATEGORIES = ['academic', 'infrastructure', 'hostel', 'library', 'cafeteria', 'transport', 'other'];

const normalize = (value) => String(value || '').toLowerCase();

const scoreCategory = (text, category) => {
  const keywords = CATEGORY_KEYWORDS[category] || [];
  let score = 0;
  for (const word of keywords) {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(text)) {
      score += 1;
    }
  }
  return score;
};

const getTopCategory = (text) => {
  const entries = Object.keys(CATEGORY_KEYWORDS).map((category) => ({
    category,
    score: scoreCategory(text, category)
  }));

  entries.sort((a, b) => b.score - a.score);
  const top = entries[0];
  const second = entries[1] || { score: 0 };

  return {
    inferredCategory: top && top.score > 0 ? top.category : 'other',
    topScore: top ? top.score : 0,
    secondScore: second.score
  };
};

function moderateComplaintCategory({ title, description, selectedCategory }) {
  const safeSelected = SUPPORTED_CATEGORIES.includes(selectedCategory) ? selectedCategory : 'other';
  const text = `${normalize(title)} ${normalize(description)}`.trim();
  const { inferredCategory, topScore, secondScore } = getTopCategory(text);

  const strongSignal = topScore >= 3 && topScore >= secondScore + 2;
  const shouldAdjust =
    inferredCategory !== 'other' &&
    inferredCategory !== safeSelected &&
    (safeSelected === 'other' || strongSignal);

  const finalCategory = shouldAdjust ? inferredCategory : safeSelected;
  const suggestedDepartment = CATEGORY_TO_DEPARTMENT[finalCategory] || 'Student Affairs';

  return {
    selectedCategory: safeSelected,
    inferredCategory,
    finalCategory,
    suggestedDepartment,
    adjusted: shouldAdjust,
    confidence: strongSignal ? 'high' : topScore > 0 ? 'medium' : 'low'
  };
}

module.exports = {
  moderateComplaintCategory,
  CATEGORY_TO_DEPARTMENT
};
