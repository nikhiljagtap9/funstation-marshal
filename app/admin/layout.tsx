import React from "react";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-gradient-to-br from-yellow-100 to-blue-100">
			{children}
		</div>
	);
}
