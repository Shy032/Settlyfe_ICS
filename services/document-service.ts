import type { Document, DocumentFilter, DocumentFolder } from "@/types/document"

export const saveDocument = (document: Document): void => {
  try {
    const documents = getDocuments()
    documents.push(document)
    localStorage.setItem("documents", JSON.stringify(documents))
  } catch (error) {
    console.error("Error saving document:", error)
  }
}

export const saveFolder = (folder: DocumentFolder): void => {
  try {
    const folders = getFolders()
    folders.push(folder)
    localStorage.setItem("documentFolders", JSON.stringify(folders))
  } catch (error) {
    console.error("Error saving folder:", error)
  }
}

export const getDocuments = (): Document[] => {
  try {
    const documents = localStorage.getItem("documents")
    return documents ? JSON.parse(documents) : []
  } catch (error) {
    console.error("Error getting documents:", error)
    return []
  }
}

export const getFolders = (): DocumentFolder[] => {
  try {
    const folders = localStorage.getItem("documentFolders")
    return folders ? JSON.parse(folders) : []
  } catch (error) {
    console.error("Error getting folders:", error)
    return []
  }
}

export const getUserDocuments = (userId: string): Document[] => {
  try {
    const documents = getDocuments()
    return documents.filter((doc) => doc.uploadedBy === userId && !doc.isCompanyDocument && !doc.isTeamDocument)
  } catch (error) {
    console.error("Error getting user documents:", error)
    return []
  }
}

export const getCompanyDocuments = (): Document[] => {
  try {
    const documents = getDocuments()
    return documents.filter((doc) => doc.isCompanyDocument && !doc.isTeamDocument)
  } catch (error) {
    console.error("Error getting company documents:", error)
    return []
  }
}

export const getTeamDocuments = (teamId: string): Document[] => {
  try {
    const documents = getDocuments()
    return documents.filter((doc) => doc.isTeamDocument && doc.teamId === teamId)
  } catch (error) {
    console.error("Error getting team documents:", error)
    return []
  }
}

export const getUserFolders = (userId: string): DocumentFolder[] => {
  try {
    const folders = getFolders()
    return folders.filter((folder) => folder.createdBy === userId && !folder.isCompanyFolder && !folder.isTeamFolder)
  } catch (error) {
    console.error("Error getting user folders:", error)
    return []
  }
}

export const getCompanyFolders = (): DocumentFolder[] => {
  try {
    const folders = getFolders()
    return folders.filter((folder) => folder.isCompanyFolder && !folder.isTeamFolder)
  } catch (error) {
    console.error("Error getting company folders:", error)
    return []
  }
}

export const getTeamFolders = (teamId: string): DocumentFolder[] => {
  try {
    const folders = getFolders()
    return folders.filter((folder) => folder.isTeamFolder && folder.teamId === teamId)
  } catch (error) {
    console.error("Error getting team folders:", error)
    return []
  }
}

export const deleteDocument = (documentId: string): void => {
  try {
    const documents = getDocuments()
    const updatedDocuments = documents.filter((doc) => doc.id !== documentId)
    localStorage.setItem("documents", JSON.stringify(updatedDocuments))
  } catch (error) {
    console.error("Error deleting document:", error)
  }
}

export const deleteFolder = (folderId: string): void => {
  try {
    const folders = getFolders()
    const documents = getDocuments()

    // Delete all documents in the folder
    const updatedDocuments = documents.filter((doc) => doc.parentFolderId !== folderId)
    localStorage.setItem("documents", JSON.stringify(updatedDocuments))

    // Delete the folder
    const updatedFolders = folders.filter((folder) => folder.id !== folderId)
    localStorage.setItem("documentFolders", JSON.stringify(updatedFolders))
  } catch (error) {
    console.error("Error deleting folder:", error)
  }
}

export const getDocumentsInFolder = (folderId?: string): Document[] => {
  try {
    const documents = getDocuments()
    return documents.filter((doc) => doc.parentFolderId === folderId)
  } catch (error) {
    console.error("Error getting documents in folder:", error)
    return []
  }
}

export const getFoldersInFolder = (parentFolderId?: string): DocumentFolder[] => {
  try {
    const folders = getFolders()
    return folders.filter((folder) => folder.parentFolderId === parentFolderId)
  } catch (error) {
    console.error("Error getting folders in folder:", error)
    return []
  }
}

export const filterDocuments = (documents: Document[], filter: DocumentFilter): Document[] => {
  return documents.filter((doc) => {
    let matches = true

    if (filter.type && doc.type) {
      if (filter.type === "pdf" && !doc.type.includes("pdf")) matches = false
      if (filter.type === "docx" && !doc.type.includes("word")) matches = false
      if (filter.type === "image" && !doc.type.includes("image")) matches = false
    }

    if (filter.department && doc.department !== filter.department) matches = false
    if (filter.visibility && doc.visibility !== filter.visibility) matches = false
    if (filter.teamId && doc.teamId !== filter.teamId) matches = false
    if (filter.folderId !== undefined && doc.parentFolderId !== filter.folderId) matches = false

    if (filter.dateRange) {
      const docDate = new Date(doc.uploadedAt).getTime()
      const startDate = new Date(filter.dateRange.start).getTime()
      const endDate = new Date(filter.dateRange.end).getTime()

      if (docDate < startDate || docDate > endDate) matches = false
    }

    return matches
  })
}
