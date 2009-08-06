class SyncBuilder::Game::Stage < SyncBuilder::Base
	def initialize object, options = {}
		super object, options
		@current_client_stage = options[:stage] if options.has_key? :stage
	end

	def data
    {
      :status => status,
			:cards => next_stage_cards.to_s
    }
	end

	private

	def next_stage_cards
		case @current_client_stage
		when Game::STATUS[:on_preflop]
			flop
		when Game::STATUS[:on_flop]
			turn
		when Game::STATUS[:on_turn]
			river
		end
	end
end