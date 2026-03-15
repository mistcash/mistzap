export default function FooterCredits({ className = "" }) {
	return (
		<section className={`text-center text-xs text-white/50 ${className}`}>
			Sponsored via AVNU paymaster.<br />
			Powered by <a href="https://MIST.cash" className="text-white/80">MIST.cash</a> on <a href="https://starknet.io" className="text-white/80">StarkNet</a>.
		</section>
	);
}