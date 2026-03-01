/**
 * Masks creator identity when returning complaints that were submitted anonymously.
 * Keeps createdBy._id for authorization but removes name, email, studentId.
 */
function maskAnonymousCreator(complaint) {
  const doc = complaint && typeof complaint.toObject === 'function'
    ? complaint.toObject()
    : complaint && typeof complaint === 'object'
      ? { ...complaint }
      : complaint;
  if (!doc || !doc.isAnonymous || !doc.createdBy) return doc;
  doc.createdBy = { _id: doc.createdBy._id || doc.createdBy };
  return doc;
}

module.exports = { maskAnonymousCreator };
