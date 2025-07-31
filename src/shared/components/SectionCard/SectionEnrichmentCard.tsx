import React, { useState, useCallback, ChangeEvent } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export interface SectionEnrichmentCardProps {
  mainTitle: string;
  items: string[];
  remark?: React.ReactNode;
  onFileUpload?: (file: File) => void;
  onSignUpClick?: () => void;
  onConnectClick?: () => void;
}

/* Icons */
const checkIcon = (
  <svg
    className="w-5 h-5 flex-shrink-0 mt-1 mr-2"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="#E95C41"
  >
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="#E95C41" strokeWidth="0.5" />
  </svg>
);
const uploadIcon = (
  <svg
    className="w-16 h-16 text-gray-400 mx-auto"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16.5V9.75m0 0l3.75 3.75M12 9.75L8.25 13.5m-1.5 8.25h11.25A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);
const bookIcon = (
  <svg
    className="w-5 h-5 flex-shrink-0 mr-2 text-[#E95C41]"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="#E95C41"
  >
    <path d="M3 5.25C3 4.007 4.007 3 5.25 3h13.5C19.993 3 21 4.007 21 5.25v13.5c0 1.243-1.007 2.25-2.25 2.25H5.25A2.25 2.25 0 013 18.75V5.25zM5.25 4.5a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75H18.75a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H5.25z" />
    <path d="M7.5 7.5h9a.75.75 0 010 1.5h-9a.75.75 0 010-1.5zm0 4h9a.75.75 0 010 1.5h-9a.75.75 0 010-1.5z" />
  </svg>
);

const SectionEnrichmentCard: React.FC<SectionEnrichmentCardProps> = ({
  mainTitle,
  items,
  remark,
  onFileUpload,
  onSignUpClick,
  onConnectClick,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      const files = event.dataTransfer.files;
      if (files.length > 0 && onFileUpload) {
        onFileUpload(files[0]);
      }
    },
    [onFileUpload]
  );

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0 && onFileUpload) {
        onFileUpload(files[0]);
        navigate('/file-upload-result', { state: { file: files[0] } }); // Navigate to new page with file state
      }
    },
    [onFileUpload, navigate]
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl mx-auto my-5">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Section: Titles and List Items */}
        <div className="flex flex-col items-start w-full md:w-1/2">
          <h1 className="font-bold text-3xl text-gray-800 mb-6">{mainTitle}</h1>
          <div className="flex flex-col gap-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start">
                {checkIcon}
                <p className="text-base text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: File Upload Area */}
        <div className="flex flex-col g-4 items-center justify-center w-full md:w-1/2">
          <div
            className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg ${
              user 
                ? `border-gray-300 bg-gray-50 ${isDragOver ? "bg-gray-100" : ""}`
                : "border-gray-200 bg-gray-100"
            }`}
            onDragOver={user ? handleDragOver : undefined}
            onDragLeave={user ? handleDragLeave : undefined}
            onDrop={user ? handleDrop : undefined}
          >
            <div className="text-center p-4 w-full">
              {uploadIcon}
              <p className={`mt-2 ${user ? "text-gray-500" : "text-gray-400"}`}>Déposez votre fichier ici</p>
              <p className={`text-sm mb-4 ${user ? "text-gray-500" : "text-gray-400"}`}>ou</p>
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={user ? handleFileSelect : undefined} 
                accept=".csv,.xlsx"
                disabled={!user}
              />
              <label
                htmlFor={user ? "file-upload" : ""}
                className={`inline-flex items-center font-medium py-3 px-6 rounded-full ${
                  user 
                    ? 'bg-gradient-to-r from-orange-400 to-[#E95C41] hover:opacity-90 text-white cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Sélectionnez votre fichier
              </label>
            </div>
          </div>
          <p className={`text-sm mt-4 ${user ? "text-gray-500" : "text-gray-400"}`}>Formats supportés: CSV et XLSX</p>
        </div>
      </div>

      {/* Bottom Section: Buttons for Sign Up and Connect */}
      {!user && (
        <div className="flex flex-col sm:flex-row justify-start items-center gap-4 mt-8 pt-4">
          <button
            onClick={onSignUpClick}
            className="inline-flex items-center bg-gradient-to-r from-orange-400 to-[#E95C41] hover:opacity-90 text-white font-medium py-3 px-6 rounded-full"
          >
            <span className="mr-2 flex-shrink-0">
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </span>
            S'inscire gratuitement
          </button>
          <button
            onClick={onConnectClick}
            className="text-[#E95C41] font-medium py-3 px-6 rounded-full hover:bg-gray-100"
          >
            Se connecter
          </button>
        </div>
      )}

      {/* Optional Remark Section */}
      {remark && (
        <div className="py-4 mt-6">
          <div className="flex items-start bg-[#FFF2EC] p-4 rounded-lg">
            {bookIcon}
            <p className="text-sm text-gray-700">{remark}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionEnrichmentCard;