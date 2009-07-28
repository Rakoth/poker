class SyncBuilder::Player::PreviousFinal < SyncBuilder::Base
	def data
		{
			:sit => sit,
			:hand => previous_hand.to_s
		}
	end
end