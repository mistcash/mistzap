export default function FooterCredits({ className = "" }) {
	return (
		<section className={`text-center text-xs text-[#d8b58d] ${className}`}>
			Sponsored via AVNU paymaster.<br />
			Powered by <a href="https://MIST.cash" className="text-[#ffb66b] hover:text-[#ff9d42]">MIST.cash</a> on <a href="https://starknet.io" className="text-[#ffb66b] hover:text-[#ff9d42]">StarkNet</a>.
		</section>
	);
}