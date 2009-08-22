class CreateGames < ActiveRecord::Migration
  def self.up
    create_table :games do |t|
      t.string :status
			t.string :paused, :null => true
      t.integer :active_player_id, :default => 0 # id игрока, от которого ожидается действие
      t.integer :blind_position
      t.integer :blind_size
      t.integer :blind_level, :default => 0
      t.integer :ante, :default => 0
      t.integer :current_bet, :default => 0
      t.datetime :next_level_time
      t.integer :players_count, :default => 0
      t.string :flop
      t.string :turn
      t.string :river
			t.string :previous_flop
      t.string :previous_turn
      t.string :previous_river
      t.string :deck
      t.references :type

      t.timestamps
    end
  end

  def self.down
    drop_table :games
  end
end
