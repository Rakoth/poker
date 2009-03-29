class Action < ActiveRecord::Base
  
  belongs_to :game
  belongs_to :player

  before_save :perform!

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

  attr_accessor :game_params

  def kind
    raise "can't resive kind of class Action"
  end

  def initialize receiver
    super :value => @value, :player => receiver, :game => receiver.game
    @game_params = {}
  end

  def execute
    save if can_perform?
  end

  protected

  def can_perform?
    true
  end

  def perform!
    game_influence
    player_influence
    game.next_active_player_id
    game.next_stage
  end

  def game_influence
    game.update_attributes!(@game_params) unless @game_params.empty?
  end

  def player_influence
  end
end
