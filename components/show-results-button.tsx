import React from "react";

export default function ShowResultsButton({
	onClick,
}: {
	onClick: () => void;
}) {
	return (
		<div className="min-h-screen bg-white flex flex-col items-center justify-center">
			<button
				className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-2xl px-10 py-6 rounded-lg shadow-lg transition-all w-full max-w-xs"
				onClick={onClick}
			>
				Show Results
			</button>
		</div>
	);
}
