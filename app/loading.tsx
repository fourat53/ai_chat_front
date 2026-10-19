import MainLoader from "@/components/reusable/loader/loader";

export default function loading() {
	return (
		<div className="w-full flex justify-center items-center h-screen">
			<MainLoader />
		</div>
	);
}
