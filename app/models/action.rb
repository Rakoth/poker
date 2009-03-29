class Action < ActiveRecord::Base
  
  belongs_to :game
  belongs_to :player

  # NAME_BY_KIND = [:pass, :check, :call, :bet, :raise]
  
  named_scope :omitted, lambda{ |game_id, last_id| {:conditions => ["game_id = ? AND id > ?", game_id, last_id]}}

  def has_value?
    kind >= 3
  end

  def time_handler
    self.game.type.action_time - (Time.now - created_at).to_i
  end

  def value
    @value ||= 0
  end

  attr_accessor :player_params
  attr_accessor :game_params
  attr_accessor :need_update_all

  def game_influence
  end

  def player_influence
  end

  def other_players_influence
  end

  def initialize receiver
    super :kind => @kind, :value => @value, :player => receiver, :game => receiver.game
    @player_params, @game_params, @need_update_all = {}, {}, false
  end

  def execute
    perform! if can_perform?
  end

  protected

  def can_perform?
    true
  end

  def perform!
    game_influence
    player_influence
    other_players_influence
    begin 
      save_changes!
    rescue
      #TODO сделать откат действия
      return false
    end
    game.next_active_player_id
    game.next_stage
    return true;
  end

  def save_changes!
    player.update_attributes!(@player_params) unless @player_params.empty?
    game.update_attributes!(@game_params) unless @game_params.empty?
    Player.update_all "for_call = for_call + #{self.value}", ["game_id = ? AND NOT id = ?", game.id, player.id] if @need_update_all
    save
  end
end
