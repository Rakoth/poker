class SyncBuilder::Game::WaitForStart < SyncBuilder::Base
	def initialize game, options = {}
		super game, options
		players_ids_array = options[:players].map(&:to_i)
		@players_to_add = players.select{|player| !players_ids_array.include?(player.id)}.map{|player| SyncBuilder::Player::Init.new player}
		@players_ids_to_remove = players_ids_array.select{|id| !players.map(&:id).include?(id)}
	end

	def data
		result = {}
		result[:players_to_add] = @players_to_add unless @players_to_add.empty?
		result[:players_ids_to_remove] = @players_ids_to_remove unless @players_ids_to_remove.empty?
		result
	end
end