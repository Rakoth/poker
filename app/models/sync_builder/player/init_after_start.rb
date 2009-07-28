class SyncBuilder::Player::InitAfterStart < SyncBuilder::Player::Init
	def data
		super.merge(
			:status => status,
			:stack => stack,
			:for_call => for_call,
			:in_pot => in_pot,
			:previous_win => previous_win,
			:act_in_this_round => act_in_this_round,
			:hand_to_load => (show_hand_to?(@for_user.id) ? hand.to_s : nil)
		)
	end
end