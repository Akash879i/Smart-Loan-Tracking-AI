import { useState, useEffect } from "react";
import { Upload, Eye, Trash2, FileImage } from "lucide-react";
import { useFirebase } from "../Auth/firebase";

export default function Documents() {
  const firebase = useFirebase();

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

  // 🔥 FETCH FROM FIRESTORE
  useEffect(() => {
    const fetchDocs = async () => {
      const docs = await firebase.getUserDocuments();
      setFiles(docs);
    };

    fetchDocs();
  }, []);

  // 🔥 UPLOAD HANDLER
  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    const validFiles = selectedFiles.filter((file) => {
      const isValidType =
        file.type === "image/jpeg" || file.type === "image/png";

      const isValidSize = file.size <= 5 * 1024 * 1024;

      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    for (let file of validFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();

        // 🔴 IMPORTANT: CHECK UPLOAD SUCCESS
        if (!data.secure_url) {
          console.error("Cloudinary error:", data);
          alert("Upload failed. Check console.");
          continue;
        }

        const docData = {
          name: file.name,
          url: data.secure_url,
          type: file.type,
          date: new Date().toISOString().split("T")[0],
          status: "verified",
        };

        // 🔥 SAVE TO FIRESTORE (GET ID BACK)
        const docRef = await firebase.addDocument(docData);

        // 🔥 UPDATE UI WITH ID
        setFiles((prev) => [
          { id: docRef.id, ...docData },
          ...prev,
        ]);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    setUploading(false);
  };

  // 🔥 DELETE (FIRESTORE + UI)
  const handleDelete = async (id) => {
    try {
      await firebase.deleteDocument(id);

      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <h1 className="text-3xl font-semibold mb-2">Document Upload</h1>
      <p className="text-gray-500 mb-8">
        Upload and manage your loan documents
      </p>

      {/* UPLOAD BOX */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-white shadow-sm mb-10">
        <Upload size={50} className="mx-auto text-gray-400 mb-4" />

        <h2 className="text-xl font-semibold mb-2">
          Upload Documents
        </h2>

        <p className="text-gray-500 mb-6">
          Only JPG & PNG allowed (Max 5MB)
        </p>

        <label className="bg-green-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-green-700 transition">
          {uploading ? "Uploading..." : "Choose File"}
          <input
            type="file"
            multiple
            accept="image/png, image/jpeg"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* DOCUMENT LIST */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">
          Uploaded Documents
        </h3>

        {files.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No documents uploaded yet
          </p>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.id} // ✅ FIXED (was index before)
                className="border rounded-xl p-4"
              >
                {/* TOP */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FileImage className="text-green-600" size={20} />
                    </div>

                    <div>
                      <p className="font-medium text-sm">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {file.date}
                      </p>
                    </div>
                  </div>

                  <span className="bg-green-100 text-green-700 px-3 py-1 text-xs rounded-full">
                    {file.status}
                  </span>
                </div>

                {/* 🔥 IMAGE PREVIEW */}
                {/* <img
                  src={file.url}
                  alt="doc"
                  className="w-full h-40 object-cover rounded-lg mb-4"
                /> */}

                {/* ACTIONS */}
                <div className="flex gap-3">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    <Eye size={16} /> View
                  </a>

                  <button
                    onClick={() => handleDelete(file.id)}
                    className="px-4 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}