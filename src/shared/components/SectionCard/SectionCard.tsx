import React from "react";

export interface SectionCardProps {
  mainTitle: string;
  subTitle: string;
  items: string[];
  remark?: React.ReactNode;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  onButtonClick?: () => void;
}

/* Icons */
const defaultButtonIcon = (
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
);
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

const SectionCard: React.FC<SectionCardProps> = ({
  mainTitle,
  subTitle,
  items,
  remark,
  buttonText,
  buttonIcon = defaultButtonIcon,
  onButtonClick,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex flex-col items-center gap-2 max-w-5xl w-full box-border p-0 md:py-7 md:px-5">
        <div className="flex flex-col items-start md:items-center gap-4">
          <h1 className="font-bold text-3xl">{mainTitle}</h1>
          <h4 className="font-bold">{subTitle}</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-4 md:py-8 px-0 md:px-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start">
              {checkIcon}
              <p className="text-sm">{item}</p>
            </div>
          ))}
        </div>

        {remark && (
          <div className="py-4">
            <div className="flex items-start bg-[#FFF2EC] p-4 rounded-lg">
              {bookIcon}
              <p className="text-sm">{remark}</p>
            </div>
          </div>
        )}

        <div className="text-center py-2">
          <button
            onClick={onButtonClick}
            className="inline-flex items-center bg-gradient-to-r from-orange-400 to-[#E95C41] hover:opacity-90 text-white font-medium py-3 px-6 rounded-full"
          >
            <span className="mr-2 flex-shrink-0">{buttonIcon}</span>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionCard;
