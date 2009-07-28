class SyncBuilder::Game::Stage < SyncBuilder::Base
	def data
    {
      :status => status,
			:cards_to_load => {
				:flop => flop.to_s,
				:turn  => turn.to_s,
				:river => river.to_s
			}
    }
	end
end