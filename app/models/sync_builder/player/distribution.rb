class SyncBuilder::Player::Distribution < SyncBuilder::Base
	def data
		{
			:sit => sit,
			:status => status,
			:stack => stack,
			:for_call => for_call,
			:in_pot => in_pot,
			:previous_win => previous_win,
			:act_in_this_round => act_in_this_round
		}
	end
end