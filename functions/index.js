const functions = require("firebase-functions")
const admin = require("firebase-admin")
admin.initializeApp()

exports.autoCalcWCS = functions.firestore.document("scores/{uid}/{weekId}").onWrite(({ after }) => {
  if (!after.exists) return null

  const data = after.data()
  if (!data.EC || !data.OC || !data.CC) return null

  const EC = data.EC
  const OC = data.OC
  const CC = data.CC

  // Calculate WCS using the formula
  const WCS = +(EC * 0.4 + OC * 0.5 + CC * 0.1).toFixed(2)

  // Update the document with the calculated WCS
  return after.ref.set(
    {
      WCS: WCS,
      // Also calculate checkMark
      checkMark: data.EC === 1.0 && data.OC === 1.0,
    },
    { merge: true },
  )
})
