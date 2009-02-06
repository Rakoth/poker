class GameType < ActiveRecord::Base
  has_many :games
  has_many :blind_values

  named_scope :for_create, :select => 'id, title'

  def pay_for_play
    start_cash + additional_cash
  end

  def prize
    start_cash * max_players
  end

  def verify_level level
    level >= min_level and level <= max_level
  end

  def get_blind_size level
    BlindValue.find_by_game_type_id_and_level(id, level)
  end

end